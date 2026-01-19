import { GoogleGenAI } from "@google/genai";
import { TravelPreferences, TravelPlan, Language, SearchSource, AIProvider } from "../types";

const generatePrompt = (prefs: TravelPreferences, language: Language): string => {
  const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const currentDate = new Date().toISOString().split('T')[0];
  const stopovers = prefs.waypoints.length > 0 ? prefs.waypoints.join(', ') : "None";
  const avoidList = prefs.avoid.length > 0 ? prefs.avoid.join(', ') : "None";
  const isCampingTrip = prefs.styles.includes('Long-distance Camping');

  return `
    Act as a senior travel planner. Create a ${prefs.days}-day trip to ${prefs.destination} for a ${prefs.companions} trip (${prefs.travelers} people).
    
    Context:
    - Trip Date: ${prefs.startDate} to ${prefs.endDate}
    - Required Stopovers: ${stopovers}

    Preferences:
    - Style: ${prefs.styles.join(", ")}
    - Exclusions: ${avoidList}
    - Pace: ${prefs.pace}, Transport: ${prefs.transportation}, Budget: ${prefs.budget}
    - Special wishes: ${prefs.customKeywords || "None"}

    Language Requirement:
    - Output ONLY in ${langName}. Keys MUST be English.

    Planning Logic:
    1. Realistic timeline: Use bold format "**09:00 (2h)** Activity...".
    2. Weather: Search or estimate specific temperature ranges, conditions, and humidity for ${prefs.destination} in ${prefs.startDate}.
    3. Exclude: ${avoidList}.
    ${isCampingTrip ? "4. Camping focus: specific sites, hiking distances, and elevation." : ""}

    OUTPUT FORMAT: Return a raw JSON object matching this schema:
    {
      "overview": { "trip_theme": "string", "total_days": number, "cities": ["string"], "pace": "string", "best_for": ["string"] },
      "weather_info": { "temperature_range": "string", "weather_condition": "string", "humidity": "string", "clothing_advice": "string" },
      "daily_plan": [{ "day": number, "city": "string", "morning": "string", "afternoon": "string", "evening": "string", "notes": "string", "plan_b": "string" }],
      "must_book_in_advance": ["string"],
      "accommodation_tips": "string",
      "transport_tips": "string",
      "final_advice": "string"
    }
  `;
};

const sanitizeString = (val: unknown): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return '';
};

const sanitizeArray = (val: unknown): string[] => {
  return Array.isArray(val) ? val.map(v => sanitizeString(v)) : [];
};

const processJsonResponse = (rawJson: any, prefs: TravelPreferences): TravelPlan => {
  return {
    overview: {
      trip_theme: sanitizeString(rawJson.overview?.trip_theme),
      total_days: Number(rawJson.overview?.total_days) || prefs.days,
      cities: sanitizeArray(rawJson.overview?.cities),
      pace: sanitizeString(rawJson.overview?.pace),
      best_for: sanitizeArray(rawJson.overview?.best_for)
    },
    weather_info: {
      temperature_range: sanitizeString(rawJson.weather_info?.temperature_range),
      weather_condition: sanitizeString(rawJson.weather_info?.weather_condition),
      humidity: sanitizeString(rawJson.weather_info?.humidity),
      clothing_advice: sanitizeString(rawJson.weather_info?.clothing_advice)
    },
    daily_plan: (Array.isArray(rawJson.daily_plan) ? rawJson.daily_plan : []).map((day: any) => ({
      day: Number(day.day),
      city: sanitizeString(day.city),
      morning: sanitizeString(day.morning),
      afternoon: sanitizeString(day.afternoon),
      evening: sanitizeString(day.evening),
      notes: sanitizeString(day.notes),
      plan_b: sanitizeString(day.plan_b)
    })),
    must_book_in_advance: sanitizeArray(rawJson.must_book_in_advance),
    accommodation_tips: sanitizeString(rawJson.accommodation_tips),
    transport_tips: sanitizeString(rawJson.transport_tips),
    final_advice: sanitizeString(rawJson.final_advice)
  };
};

const callDeepSeek = async (prompt: string, prefs: TravelPreferences): Promise<TravelPlan> => {
  const apiKey = (process.env as any).DEEPSEEK_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Missing DeepSeek API Key");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a professional travel planner. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw new Error(`DeepSeek API Error: ${response.statusText}`);
  const data = await response.json();
  return processJsonResponse(JSON.parse(data.choices[0].message.content), prefs);
};

const callGemini = async (prompt: string, prefs: TravelPreferences, language: Language): Promise<TravelPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "World-class travel agent AI. Focus on realism and logic."
      }
    });

    let text = response.text || '';
    const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    const rawJson = JSON.parse(cleanJson);
    const plan = processJsonResponse(rawJson, prefs);

    // Add sources if available
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const sources: SearchSource[] = [];
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      });
      plan.search_sources = Array.from(new Map(sources.map(s => [s.url, s])).values());
    }
    return plan;
  } catch (err) {
    // Fallback without search
    const response = await ai.models.generateContent({ model, contents: prompt });
    return processJsonResponse(JSON.parse(response.text?.replace(/```json|```/g, '') || '{}'), prefs);
  }
};

export const generateItinerary = async (prefs: TravelPreferences, language: Language): Promise<TravelPlan> => {
  const prompt = generatePrompt(prefs, language);
  if (prefs.provider === 'deepseek') {
    return callDeepSeek(prompt, prefs);
  }
  return callGemini(prompt, prefs, language);
};