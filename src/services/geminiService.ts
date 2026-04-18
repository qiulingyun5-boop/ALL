
export async function analyzeNutritionLabel(base64Image: string) {
  try {
    const response = await fetch('/api/ai/analyze-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Nutrition Analysis Error:", error);
    const errorMsg = error?.message || "灵鉴识物失败";
    
    if (typeof window !== 'undefined') {
      alert("⚠️ 【灵鉴视物中断】:\n" + errorMsg + "\n\n1. 请确保图片清晰。\n2. 请检查网络连接。\n3. 服务器响应异常。");
    }
    
    throw new Error(errorMsg);
  }
}
