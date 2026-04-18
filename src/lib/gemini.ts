

export async function analyzeProgressPhotos(photos: { url: string; type: string }[]) {
  try {
    // Convert blob/data URLs to base64 on client before sending to server
    const processedPhotos = await Promise.all(photos.map(async (p) => {
      const response = await fetch(p.url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      return { data: base64.split(',')[1], type: p.type };
    }));

    const response = await fetch('/api/ai/analyze-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos: processedPhotos })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return JSON.stringify(data);
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    const errorMsg = error?.message || "网络请求失败";
    
    // Explicit debug alert as requested by user
    if (typeof window !== 'undefined') {
      alert("⚠️ 【识海警示】AI 分析异常 (Photos):\n" + errorMsg + "\n\n1. 请检查网络连接。\n2. 若提示 API key invalid，请确保已在后台正确配置密钥。\n3. 服务器状态码: " + (error?.status || "未知"));
    }
    
    return JSON.stringify({
      bodyFat: 0,
      analysis: "AI 分析失败: " + errorMsg
    });
  }
}

export async function getHealthAdvice(prompt: string) {
  try {
    const response = await fetch('/api/ai/health-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMsg = error?.message || "灵力流转不畅";
    
    if (typeof window !== 'undefined') {
      alert("⚠️ 【仙导传音中断】:\n" + errorMsg + "\n\n请检查灵气连接（网络）。服务器通讯异常。");
    }
    
    return "抱歉，道友。仙导识海震荡，暂无法回话。请检查灵气连接（网络）后再试。具体因由: " + errorMsg;
  }
}
