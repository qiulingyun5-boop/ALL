import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for images
app.use(express.json({ limit: "50mb" }));

// --- AI Service Logic ---
// VERSION: 1.0.3 - Corrected SDK and Models
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY1 || "" });

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.3", model: "gemini-3-flash-preview" });
});

// 1. Analyze Nutrition Label
app.post("/api/ai/analyze-nutrition", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Missing image data" });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            proteinPer100g: { type: Type.NUMBER },
            carbsPer100g: { type: Type.NUMBER },
            fatPer100g: { type: Type.NUMBER },
            caloriesPer100g: { type: Type.NUMBER },
          },
          required: ["name", "proteinPer100g", "carbsPer100g", "fatPer100g", "caloriesPer100g"],
        }
      },
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: `You are an expert nutrition analyst. Analyze this nutrition label image.
        Extract: food name, protein, carbs, fat, calories.
        IMPORTANT: All values MUST be normalized to 100g. If the label shows values per serving (e.g., "30g"), you MUST calculate the value for 100g.` }
      ]
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Nutrition AI Error:", error);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
});

// 2. Health Advice (Cultivation Mode)
app.post("/api/ai/health-advice", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "你是一位隐居多年的修仙界健身宗师（仙导）。请以修仙者的口吻，结合现代健身 and 营养学，为后生小辈提供练体建议。回复应庄重而富有禅意，使用‘道友’、‘根骨’、‘灵气’等词汇，鼓励其早日结丹破境。回复需简洁直接。",
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Advice AI Error:", error);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
});

// 3. Analyze Progress Photos
app.post("/api/ai/analyze-progress", async (req, res) => {
  try {
    const { photos } = req.body; // Array of { data: base64, type: 'front'|'side' }
    if (!photos || !photos.length) return res.status(400).json({ error: "Missing photos" });

    const apiParams = {
      model: "gemini-3-flash-preview",
      config: { responseMimeType: "application/json" },
      contents: [
        ...photos.map((p) => ({
          inlineData: { mimeType: "image/jpeg", data: p.data }
        })),
        { text: `
          你是一位专业的健身教练和体态分析专家。
          请分析这些用户的健身进度照片。
          请以 JSON 格式返回结果，包含以下字段：
          - bodyFat: 数字（百分比，仅数字）
          - analysis: 详细的文本分析报告
        ` }
      ]
    };

    const response = await ai.models.generateContent(apiParams);
    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error("Progress AI Error:", error);
    res.status(500).json({ error: error.message || "Internal AI Error" });
  }
});

// --- Server & Vite Setup ---

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback for production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server v1.0.3 running at http://localhost:${PORT} [${isProd ? 'PROD' : 'DEV'}]`);
  });
}

startServer();
