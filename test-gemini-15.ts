import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Hello",
    });
    console.log("SUCCESS:", response.text);
  } catch (err: any) {
    console.error("ERROR:");
    console.error(err.message || err);
  }
}

test();
