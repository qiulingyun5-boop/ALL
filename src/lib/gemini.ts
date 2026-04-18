import { GoogleGenAI, Type } from "@google/genai";

const USER_KEY = "AIzaSyDRfnATJQFXUg2mrs9rhBhwvUOLq4Q7xsI";
const envKey = import.meta.env.VITE_GEMINI_API_KEY1;
const apiKey = envKey || USER_KEY;

// 生产环境自检逻辑 (Vercel Console 可见)
if (import.meta.env.PROD) {
  console.log("✅ [识海核心状态]: 灵力通道已建立。模式: 前端直连。");
  if (!envKey) {
    console.log("ℹ️ [识海提示]: 未发现环境变量，已启用稳固秘钥模式。");
  }
}

const ai = new GoogleGenAI({ apiKey: apiKey });

/**
 * 核心提醒：使用 'gemini-flash-latest' 以确保兼容性。
 */
const MODEL_NAME = "gemini-flash-latest"; 

export async function analyzeProgressPhotos(photos: { url: string; type: string }[]) {
  try {
    if (!apiKey) throw new Error("API Key 未配置，请在 Vercel 环境变量中设置 VITE_GEMINI_API_KEY1");

    const processedPhotos = await Promise.all(photos.map(async (p) => {
      const response = await fetch(p.url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      return { inlineData: { mimeType: "image/jpeg", data: base64.split(',')[1] } };
    }));

    const prompt = `
      你是一位专业的健身教练和体态分析专家。
      请分析这些用户的健身进度照片。
      请以 JSON 格式返回结果，包含以下字段：
      - bodyFat: 数字（百分比，仅数字）
      - analysis: 详细的文本分析报告
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [...processedPhotos, { text: prompt }] }],
    });

    return response.text;
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    let errorMsg = error?.message || "网络请求失败";
    
    if (errorMsg.includes("Unexpected token") || errorMsg.includes("<")) {
      errorMsg = "服务器返回了非 JSON 响应（可能是 404 或 500 错误页）。请确认 Vercel 环境变量配置是否正确。";
    }

    if (typeof window !== 'undefined') {
      alert("⚠️ 【识海警示】AI 分析异常 (Photos):\n" + errorMsg + "\n\n1. 请检查网络连接。\n2. 确认 Vercel 环境变量已同步。");
    }
    
    return JSON.stringify({
      bodyFat: 0,
      analysis: "AI 分析失败: " + errorMsg
    });
  }
}

export async function getHealthAdvice(prompt: string) {
  try {
    if (!apiKey) throw new Error("API Key 未配置");

    const response = await ai.models.generateContent({ 
      model: MODEL_NAME,
      config: {
        systemInstruction: "你是一位隐居多年的修仙界健身宗师（仙导）。请以修仙者的口吻，结合现代健身 and 营养学，为后生小辈提供练体建议。回复应庄重而富有禅意，使用‘道友’、‘根骨’、‘灵气’等词汇，鼓励其早日结丹破境。回复需简洁直接。",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMsg = error?.message || "灵力流转不畅";
    
    if (errorMsg.includes("Unexpected token") || errorMsg.includes("<")) {
      errorMsg = "通讯中断 (非 JSON 响应)。请检查 Vercel 环境变量 VITE_GEMINI_API_KEY1 是否正确配置。";
    }

    if (typeof window !== 'undefined') {
      alert("⚠️ 【仙导传音中断】:\n" + errorMsg + "\n\n请检查网络及 VITE_GEMINI_API_KEY1 配置。");
    }
    
    return "抱歉，道友。仙导识海震荡，暂无法回话。具体因由: " + errorMsg;
  }
}

export async function analyzeNutritionLabel(base64Image: string) {
  try {
    if (!apiKey) throw new Error("API Key 未配置");

    const prompt = `You are an expert nutrition analyst. Analyze this nutrition label image.
    Extract: food name, protein, carbs, fat, calories.
    IMPORTANT: All values MUST be normalized to 100g. If the label shows values per serving (e.g., "30g"), you MUST calculate the value for 100g.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
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
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        { text: prompt }
      ]
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Nutrition Analysis Error:", error);
    let errorMsg = error?.message || "灵鉴识物失败";

    if (errorMsg.includes("Unexpected token") || errorMsg.includes("<")) {
      errorMsg = "解析异常 (非 JSON 响应)。请检查 API 密钥配置。";
    }
    
    if (typeof window !== 'undefined') {
      alert("⚠️ 【灵鉴视物中断】:\n" + errorMsg + "\n\n请检查图片清晰度及 VITE_GEMINI_API_KEY1 配置。");
    }
    
    throw new Error(errorMsg);
  }
}
