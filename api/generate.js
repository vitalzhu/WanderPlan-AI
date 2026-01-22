
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export const config = {
  runtime: 'edge', // Use Edge runtime for better performance
};

// --- Prompt Generation Logic (Moved from Client) ---
const generatePrompt = (prefs, language, provider) => {
  const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const currentDate = new Date().toISOString().split('T')[0];
  const stopovers = prefs.waypoints.length > 0 ? prefs.waypoints.join(', ') : "None";
  const avoidList = prefs.avoid.length > 0 ? prefs.avoid.join(', ') : "None";
  const isCampingTrip = prefs.styles.includes('Long-distance Camping');
  const isGemini = provider === 'gemini';

  return `
    Act as a senior travel planner. Create a ${prefs.days}-day trip to ${prefs.destination} for a ${prefs.companions} trip (${prefs.travelers} people).
    
    Context:
    - Current Date: ${currentDate}
    - Trip Start Date: ${prefs.startDate}
    - Trip End Date: ${prefs.endDate}
    - Main Destination: ${prefs.destination}
    - Required Stopovers/Waypoints: ${stopovers}

    Preferences:
    - Style: ${prefs.styles.join(", ")}
    - Avoid/Dislike: ${avoidList}
    - Pace: ${prefs.pace}
    - Transport Mode: ${prefs.transportation}
    - Budget: ${prefs.budget}
    - Special requests: ${prefs.customKeywords || "None"}

    Language Requirement:
    - Output the content strictly in ${langName}.
    - IMPORTANT: The JSON keys (e.g., "overview", "daily_plan", "weather_info") MUST remain in English. Only the values should be in ${langName}.

    Planning Logic (STRICT):
    1. Travel Philosophy: One main activity per morning, one flexible activity per afternoon. Evenings are low-effort. Max 2 must-do items/day.
    2. City & Route: 
       - Start from the arrival point (usually ${prefs.destination} or a major hub).
       - You MUST include visits to the following required stopovers: ${stopovers}.
       - Ensure the "overview.cities" list includes the main destination AND all visited stopovers.
       - Organize these stops in a logical geographical order to minimize travel time and backtracking.
       - Minimize hotel changes where possible, but stay overnight in stopovers if it makes sense for the schedule.
    3. Plan B: Always provide a backup plan (indoor/low energy) for bad weather or fatigue.
    4. Reality Check: Assume day 1 and day ${prefs.days} are partial travel days if > 2 days.
    5. Group Size Considerations: Since there are ${prefs.travelers} people, ensure activities and transport are appropriate for this group size.
    6. Weather & Clothing: 
       ${isGemini ? `- USE GOOGLE SEARCH to find the historical weather average or forecast (if dates are close) for ${prefs.destination} during the trip dates (${prefs.startDate}).` : `- Estimate the historical weather average for ${prefs.destination} during the trip dates (${prefs.startDate}) based on your knowledge.`}
       - Provide SPECIFIC temperature ranges (e.g., 20-25°C), general weather conditions (e.g., Sunny, Rainy, Cloudy), humidity levels (e.g., Low, High, 80%), and clothing advice.
    7. Transport Mode: The user plans to use ${prefs.transportation}. 
       - If "Self-driving", include parking tips and scenic driving routes where applicable.
       - If "Public Transit", ensure activities are accessible by metro/bus/train and mention key routes.
       - If "Private Charter", assume door-to-door convenience but suggest worthwhile stops.
    8. Exclusions: STRICTLY AVOID suggesting activities, locations, or areas related to: ${avoidList}.
    9. TIME & LOGISTICS (MANDATORY):
       - For every major activity in 'morning', 'afternoon', and 'evening', strictly START with the suggested **Start Time** and **Duration**.
       - Format: "**09:00 (2h)** Activity Name..." (Use bolding markers ** for the time/duration).
       - If moving between cities, explicitly state the **Departure Time** and **Travel Duration** (e.g., "**08:00 (1.5h travel)** Take Shinkansen to Kyoto").
    ${isCampingTrip ? `
    10. CAMPING & HIKING SPECIAL INSTRUCTIONS (CRITICAL):
       - Since the user selected "Long-distance Camping", the itinerary MUST focus on hiking trails and camping.
       - Daily Plan: Explicitly mention hiking distances (km/miles) and elevation gain/loss for each day where applicable.
       - Accommodation: You MUST suggest specific campsites (official or wild camping spots) instead of hotels for the nights on the trail.
       - Logistics: Mention water sources, resupply points for food, and permit requirements if any.
       - Safety: Highlight terrain difficulties and mandatory gear for this specific route.
    ` : ''}

    OUTPUT FORMAT:
    You must return a valid JSON object. Do not wrap it in markdown code blocks. The JSON must match this schema:
    {
      "overview": {
        "trip_theme": "string",
        "total_days": number,
        "cities": ["string"],
        "pace": "string",
        "best_for": ["string"]
      },
      "weather_info": {
        "temperature_range": "string",
        "weather_condition": "string",
        "humidity": "string",
        "clothing_advice": "string"
      },
      "daily_plan": [
        {
          "day": number,
          "city": "string",
          "morning": "string",
          "afternoon": "string",
          "evening": "string",
          "notes": "string",
          "plan_b": "string"
        }
      ],
      "must_book_in_advance": ["string"],
      "accommodation_tips": "string",
      "transport_tips": "string",
      "final_advice": "string"
    }
  `;
};

// --- Request Handler ---
export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { prefs, language } = await req.json();
    const prompt = generatePrompt(prefs, language, prefs.provider);
    
    // --- GEMINI HANDLER ---
    if (prefs.provider === 'gemini') {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY; // Vercel env var
      if (!apiKey) throw new Error("Server Error: Missing Google API Key");

      const ai = new GoogleGenAI({ apiKey });
      
      // Try with search
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "You are a world-class travel agent AI. Return valid JSON.",
            responseMimeType: "application/json"
          }
        });
        
        // Extract grounding chunks manually for the response
        const sources = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
           response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
             if (chunk.web?.uri && chunk.web?.title) {
               sources.push({ title: chunk.web.title, url: chunk.web.uri });
             }
           });
        }

        return new Response(JSON.stringify({ 
          text: response.text,
          sources: sources
        }), { status: 200 });

      } catch (err) {
        console.warn("Gemini Search failed, falling back", err);
        // Fallback without search
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return new Response(JSON.stringify({ text: response.text, sources: [] }), { status: 200 });
      }
    }

    // --- SILICONFLOW HANDLER (OpenAI Compatible) ---
    if (prefs.provider === 'siliconflow') {
      const apiKey = process.env.SILICONFLOW_API_KEY; // Vercel env var
      if (!apiKey) throw new Error("Server Error: Missing SiliconFlow API Key");

      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: "https://api.siliconflow.cn/v1" 
      });

      const completion = await openai.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3", // High quality, low cost model
        messages: [
          { role: "system", content: "You are a world-class travel agent AI. Always return valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const text = completion.choices[0].message.content;
      return new Response(JSON.stringify({ text, sources: [] }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid Provider" }), { status: 400 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
