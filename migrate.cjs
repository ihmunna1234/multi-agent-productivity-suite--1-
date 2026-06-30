const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Replace import
code = code.replace(
  'import { GoogleGenAI, Type } from "@google/genai";',
  'import OpenAI from "openai";\nconst Type = { STRING: "string", NUMBER: "number", INTEGER: "integer", BOOLEAN: "boolean", ARRAY: "array", OBJECT: "object" };'
);

// Replace GEMINI_API_KEY with OPENAI_API_KEY in the environment check
code = code.replace(/process\.env\.GEMINI_API_KEY/g, 'process.env.OPENAI_API_KEY');
code = code.replace(/"GEMINI_API_KEY is missing/g, '"OPENAI_API_KEY is missing');
code = code.replace(/Google Gemini API Key/g, 'OpenAI API Key');
code = code.replace(/\[Gemini API\]/g, '[OpenAI API]');
code = code.replace(/\[Gemini Auto-Retry\]/g, '[OpenAI Auto-Retry]');
code = code.replace(/\[Gemini Fallback Activated\]/g, '[OpenAI Fallback Activated]');

// Re-write getGeminiClient -> getOpenAIClient
code = code.replace(/let aiClient: GoogleGenAI \| null = null;/g, 'let aiClient: OpenAI | null = null;');
code = code.replace(/function getGeminiClient\(\): GoogleGenAI \{/g, 'function getOpenAIClient(): OpenAI {');
code = code.replace(/getGeminiClient\(\)/g, 'getOpenAIClient()');

// Replace the GoogleGenAI instantiation
const newClientCode = `
    aiClient = new OpenAI({
      apiKey,
    });
`;
code = code.replace(/aiClient = new GoogleGenAI\(\{[\s\S]*?\}\);/, newClientCode.trim());

// Rewrite generateContentWithRetry
const generateContentWithRetryRegex = /async function generateContentWithRetry\(client: GoogleGenAI, params: any, maxAttempts = 3, initialDelayMs = 1200\): Promise<any> \{[\s\S]*?\n\}/;
const newRetryCode = `async function generateContentWithRetry(client: OpenAI, params: any, maxAttempts = 3, initialDelayMs = 1200): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      
      let messages = [];
      let content = [];
      if (typeof params.contents === "string") {
         content = params.contents;
      } else if (Array.isArray(params.contents)) {
         for (const part of params.contents) {
            if (part.text) {
               content.push({ type: "text", text: part.text });
            }
            if (part.inlineData) {
               content.push({ 
                 type: "image_url", 
                 image_url: { url: \`data:\${part.inlineData.mimeType};base64,\${part.inlineData.data}\` } 
               });
            }
         }
      }
      messages = [{ role: "user", content }];

      const openaiParams: any = {
         model: "gpt-4o-mini", // defaulting to mini to replace flash
         messages: messages,
      };

      if (params.config?.responseMimeType === "application/json" && params.config?.responseSchema) {
         const schema = JSON.parse(JSON.stringify(params.config.responseSchema));
         
         function fixSchema(s) {
             if (s.type === "object") {
                 s.additionalProperties = false;
                 if (!s.required) s.required = [];
                 if (s.properties) {
                    for (const k of Object.keys(s.properties)) {
                       fixSchema(s.properties[k]);
                       if (!s.required.includes(k)) s.required.push(k);
                    }
                 }
             } else if (s.type === "array" && s.items) {
                 fixSchema(s.items);
             }
         }
         fixSchema(schema);

         openaiParams.response_format = {
            type: "json_schema",
            json_schema: {
               name: "json_response",
               schema: schema,
               strict: true
            }
         };
      }

      const response = await client.chat.completions.create(openaiParams);
      const responseText = response.choices[0]?.message?.content || "";
      return { text: responseText };
    } catch (err: any) {
      let errMsg = err.message || String(err);
      const statusText = String(err.status || err.code || "").toUpperCase();
      const statusCode = Number(err.status || err.statusCode || 0);

      const isQuotaExceeded = statusText === "RESOURCE_EXHAUSTED" || statusCode === 429 || errMsg.includes("429") || errMsg.includes("quota");
      if (isQuotaExceeded) {
        throw err;
      }

      const isTransient = statusText === "UNAVAILABLE" || statusCode === 503 || errMsg.includes("503") || errMsg.includes("high demand") || errMsg.includes("temporary");
        
      if (isTransient && attempt < maxAttempts) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        console.log(\`[OpenAI Auto-Retry] Attempt \${attempt} - Busy. Retrying in \${delay}ms...\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}`;
code = code.replace(generateContentWithRetryRegex, newRetryCode);

fs.writeFileSync('server.ts', code);
console.log('Migration complete');
