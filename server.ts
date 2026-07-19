import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// OpenAI dependency removed — all AI features now use Google Gemini exclusively

dotenv.config({ override: true });

// Standardize console logs to include UTC timestamps for production monitoring
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args: any[]) => {
  originalLog(`[${new Date().toISOString()}] [INFO]`, ...args);
};
console.warn = (...args: any[]) => {
  originalWarn(`[${new Date().toISOString()}] [WARN]`, ...args);
};
console.error = (...args: any[]) => {
  originalError(`[${new Date().toISOString()}] [ERROR]`, ...args);
};



// Refuse to start if critical environment variables are missing or set to defaults
const criticalApiKey = process.env.GEMINI_API_KEY;
if (!criticalApiKey || criticalApiKey === "YOUR_API_KEY" || criticalApiKey.trim() === "") {
  console.error("===============================================================");
  console.error("CRITICAL CONFIGURATION ERROR: GEMINI_API_KEY is not set or is a placeholder.");
  console.error("Please configure a valid Gemini API key in your environment settings.");
  console.error("===============================================================");
  process.exit(1);
}

const app = express();
const PORT = 3000;

// 1. Security Headers Middleware (VULN-06 fix: removed unsafe-eval, nonce-based CSP in production)
app.use((_req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.cspNonce = nonce;
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  const isDev = process.env.NODE_ENV !== "production";
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; ` +
    // In dev, Vite HMR needs unsafe-eval. In production, removed entirely.
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}; ` +
    `img-src 'self' data: https: blob:; ` +
    `style-src 'self' 'unsafe-inline'; ` +
    `font-src 'self' data:; ` +
    `connect-src 'self' https://places.googleapis.com https://*.supabase.co wss://*.supabase.co;`
  );
  next();
});

// 2. CORS Restrict Origin Middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://tools.iaminjamul.com",
    "http://localhost:3000",
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// 3. In-memory Rate Limiting Middleware for API requests (Max 30 requests per min per IP)
const rateLimitWindow = 60 * 1000;
const maxRequestsPerIp = 30;
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

// VULN-02 fix: Secure IP extraction — use x-real-ip (set by trusted proxy/Vercel)
// or take the LAST entry of x-forwarded-for (also set by the proxy, not the client).
function getRealIp(req: express.Request): string {
  // x-real-ip is injected by Vercel/nginx — not user-controllable
  const realIp = req.headers["x-real-ip"] as string;
  if (realIp && realIp.trim()) return realIp.trim();

  // Take the LAST IP in the chain (proxy-appended), not the first (user-controlled)
  const forwarded = req.headers["x-forwarded-for"] as string;
  if (forwarded) {
    const ips = forwarded.split(",").map(s => s.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1];
  }

  return req.socket.remoteAddress || "unknown";
}

app.use("/api", (req, res, next) => {
  const ip = getRealIp(req);
  const now = Date.now();

  let record = ipRequestCounts.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + rateLimitWindow };
  }

  record.count++;
  ipRequestCounts.set(ip, record);

  if (record.count > maxRequestsPerIp) {
    const correlationId = Math.random().toString(36).substring(2, 10);
    console.warn(`[Rate Limit Exceeded] IP: ${ip}, Request Count: ${record.count}, Error ID: ${correlationId}`);
    res.status(429).json({
      error: "Too many requests. Please try again later.",
      correlationId
    });
    return;
  }

  next();
});

// VULN-05 fix: Reduced from 50mb to 15mb. Server-side validation handles the rest.
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// ─── VULN-03 fix: JWT Auth middleware ─────────────────────────────────────────
// Verifies the Bearer token on every protected /api/* route.
function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: missing or invalid token." });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[Auth] JWT_SECRET is not configured.");
    res.status(500).json({ error: "Server misconfiguration." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: token invalid or expired." });
  }
}





// ─── VULN-03 fix: Login endpoint — issues a signed JWT on valid passcode ──────
// This is the ONLY unauthenticated API endpoint (besides /api/health).
app.post("/api/auth/login", (req, res) => {
  const { passcode } = req.body as { passcode?: string };
  const expected = process.env.APP_PASSCODE;

  if (!expected || !passcode || passcode.trim() !== expected) {
    res.status(401).json({ error: "Invalid passcode." });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration." });
    return;
  }

  const token = jwt.sign(
    { sub: "workspace-user", iat: Math.floor(Date.now() / 1000) },
    secret,
    { algorithm: "HS256", expiresIn: "8h" }
  );

  res.json({ token });
});

// Route to verify if the client's current session token is valid and not expired
app.get("/api/auth/verify", authMiddleware, (req, res) => {
  res.json({ valid: true, user: (req as any).user });
});

async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      // Only serve index.html for GET page navigation requests, bypassing static assets / source files
      if (req.method !== "GET" || (!req.headers.accept?.includes("text/html") && req.originalUrl.includes("."))) {
        return next();
      }
      try {
        const fs = await import("fs");
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        // Always transform using the base URL context to guarantee React Fast Refresh preamble is injected
        template = await vite.transformIndexHtml(req.baseUrl || "/", template);
        
        // Force-inject synchronous preamble placeholders at the top of head to prevent plugin-react from crashing
        const syncPreamble = `
    <script>
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
`;
        template = template.replace("<head>", `<head>${syncPreamble}`);

        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    if (!process.env.VERCEL) {
      
  app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Injamus's AI Workspace Server] Live and listening on hmr/http://localhost:${PORT}`);
    });
  }
}

serveApp().catch((err) => {
  console.error("Failed to boot full-stack Express server:", err);
});

export default app;
