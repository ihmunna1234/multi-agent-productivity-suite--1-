import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

// OpenAI dependency removed — all AI features now use Google Gemini exclusively
import { GoogleGenAI } from "@google/genai";
const Type = { STRING: "string", NUMBER: "number", INTEGER: "integer", BOOLEAN: "boolean", ARRAY: "array", OBJECT: "object" };

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

// Supabase client initialization wrapper
let supabaseClient: any = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn("[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY environment variables are missing. Supabase integrations are disabled.");
      return null;
    }
    supabaseClient = createClient(url, key);
    console.log("[Supabase] Client initialized successfully.");
  }
  return supabaseClient;
}

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
app.use((req, res, next) => {
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

// ─── VULN-05 fix: Server-side file validation ─────────────────────────────────
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png",
  "image/webp", "image/gif", "image/bmp"
]);

function validateBase64Image(
  imageBase64: string,
  clientMimeType: string
): { valid: boolean; mimeType: string; error?: string } {
  // ~10MB decoded = ~13.4MB base64. Enforce hard cap.
  if (imageBase64.length > 14_000_000) {
    return { valid: false, mimeType: "", error: "Image exceeds the 10MB size limit." };
  }

  const safeMime = (clientMimeType || "").toLowerCase().trim();
  if (!ALLOWED_IMAGE_MIME_TYPES.has(safeMime)) {
    return {
      valid: false,
      mimeType: "",
      error: "Invalid file type. Only JPEG, PNG, WebP, GIF, and BMP are allowed."
    };
  }

  // Inspect actual magic bytes to confirm the claimed MIME type
  try {
    const decoded = Buffer.from(imageBase64.substring(0, 24), "base64");
    const isJpeg = decoded[0] === 0xff && decoded[1] === 0xd8;
    const isPng = decoded[0] === 0x89 && decoded[1] === 0x50 && decoded[2] === 0x4e && decoded[3] === 0x47;
    const isGif = decoded[0] === 0x47 && decoded[1] === 0x49 && decoded[2] === 0x46;
    // WebP: bytes 0-3 = RIFF, bytes 8-11 = WEBP
    const isWebp = decoded[0] === 0x52 && decoded[1] === 0x49 && decoded[8] === 0x57 && decoded[9] === 0x45;
    // BMP magic bytes
    const isBmp = decoded[0] === 0x42 && decoded[1] === 0x4d;

    if (!isJpeg && !isPng && !isGif && !isWebp && !isBmp) {
      return {
        valid: false,
        mimeType: "",
        error: "File content does not match a supported image format."
      };
    }
  } catch {
    return { valid: false, mimeType: "", error: "Could not read file content." };
  }

  return { valid: true, mimeType: safeMime };
}

// ─── VULN-07 fix: Input sanitizer for all user-controlled prompt parameters ───
function sanitizePromptInput(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    // Strip control characters (could break prompt structure)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    // Escape double-quotes used as JSON / prompt delimiters
    .replace(/"/g, "'");
}


// Lazy initializer for the Google Gemini client (superior Arabic OCR)
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is not set. Add it to Vercel Environment Variables.");
    }
    geminiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
    console.log("[Gemini API] Client initialized for Arabic OCR.");
  }
  return geminiClient;
}

// Gemini retry helper — retries on transient 503 errors, immediately throws on 429 quota
async function generateContentWithRetry(client: GoogleGenAI, params: any, maxAttempts = 3, initialDelayMs = 1200): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      const response = await client.models.generateContent(params);
      return response;
    } catch (err: any) {
      const errMsg = err.message || String(err);
      const statusCode = Number(err.status || err.statusCode || 0);

      const isQuotaExceeded = statusCode === 429 || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
      if (isQuotaExceeded) throw err;

      const isTransient = statusCode === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
      if (isTransient && attempt < maxAttempts) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(`[Gemini Auto-Retry] Attempt ${attempt} failed (503). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
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
      
  app.get("*", (req, res) => {
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
