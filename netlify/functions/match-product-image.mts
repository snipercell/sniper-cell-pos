export default async (req: Request) => {
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) return Response.json({ error: "ميزة التعرّف الذكي الاحتياطية غير مفعّلة بعد. يلزم إضافة مفتاح Google المجاني إلى إعدادات Netlify." }, { status: 503 });
  try {
    const body = await req.json();
    const image = String(body?.image || "");
    const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0, 6) : [];
    const toPart = (dataUrl: string) => {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) throw new Error("صيغة صورة غير مدعومة");
      return { inline_data: { mime_type: m[1], data: m[2] } };
    };
    if (!image || !candidates.length) return Response.json({ error: "الصورة أو قائمة الأصناف غير مكتملة" }, { status: 400 });
    const parts: any[] = [
      { text: "أنت نظام مطابقة صور منتجات لمتجر. الصورة الأولى هي صورة المنتج المطلوب بيعه. الصور التالية صور مرجعية محفوظة لأصناف المتجر، وكل صورة مرجعية يتبعها معرّف واسم. قارن شكل العبوة والمنتج والعلامة والألوان، ولا تعتمد على تشابه اللون وحده. أعد JSON فقط بالشكل { \"match_id\": \"معرّف مطابق\", \"confidence\": 0.0 } أو match_id=null إذا لم تكن واثقاً. لا تخمّن." },
      { text: "صورة المنتج المطلوب:" },
      toPart(image)
    ];
    for (const c of candidates) {
      if (!c?.id || !c?.image) continue;
      parts.push({ text: "الصنف المرجعي: id=" + String(c.id) + "؛ الاسم=" + String(c.name || "") });
      parts.push(toPart(String(c.image)));
    }
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" }
      })
    });
    const payload = await response.json();
    if (!response.ok) return Response.json({ error: payload?.error?.message || "تعذّر إكمال المطابقة الذكية" }, { status: response.status });
    const raw = payload?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch { throw new Error("لم تصل نتيجة مطابقة صالحة"); }
    const chosen = candidates.find((c: any) => String(c.id) === String(parsed.match_id));
    if (!chosen || Number(parsed.confidence) < 0.72) return Response.json({ match: null, confidence: Number(parsed.confidence) || 0 });
    return Response.json({ match: { id: chosen.id, name: chosen.name }, confidence: Number(parsed.confidence) || 0 });
  } catch (error: any) {
    return Response.json({ error: error?.message || "حدث خطأ أثناء مطابقة الصورة" }, { status: 400 });
  }
};