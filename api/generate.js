
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export const config = {
  runtime: 'edge',
};

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
    - IMPORTANT: The JSON keys (e.g., "overview", "daily_plan", "morning", "why_this_place") MUST remain in English. Only the values should be in ${langName}.

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
    9. DETAILED DAILY LOGISTICS (MANDATORY):
       - For each part of the day (morning, afternoon, evening), you MUST provide a structured object.
       - "time": Start time and duration (e.g., "09:00 (2h)").
       - "activity": The name of the main location/activity.
       - "description": A vivid description of what to do.
       - "why_this_place": A specific reason why this location was chosen (e.g., "Famous for X", "Fits the quiet vibe").
       - "reservation": Booking requirements (e.g., "No need", "Book 2 weeks ahead").
       - "items_to_bring": Recommended items (e.g., "Comfortable shoes", "Camera", "Sunscreen").
       - "theme": A short, catchy theme for the specific day (e.g., "Historical Deep Dive", "Nature & Relaxation").
    ${isCampingTrip ? `
    10. CAMPING & HIKING SPECIAL INSTRUCTIONS (CRITICAL):
       - Since the user selected "Long-distance Camping", the itinerary MUST focus on hiking trails and camping.
       - "morning/afternoon/evening" should reflect the hike progress.
       - In "accommodation_tips", MUST suggest specific campsites (official or wild camping spots).
       - In "items_to_bring", mention specific gear (e.g., "Water filter", "Trekking poles").
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
          "theme": "string",
          "morning": {
            "time": "string",
            "activity": "string",
            "description": "string",
            "why_this_place": "string",
            "reservation": "string",
            "items_to_bring": "string"
          },
          "afternoon": {
            "time": "string",
            "activity": "string",
            "description": "string",
            "why_this_place": "string",
            "reservation": "string",
            "items_to_bring": "string"
          },
          "evening": {
            "time": "string",
            "activity": "string",
            "description": "string",
            "why_this_place": "string",
            "reservation": "string",
            "items_to_bring": "string"
          },
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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { prefs, language } = await req.json();
    const prompt = generatePrompt(prefs, language, prefs.provider);
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // --- GEMINI HANDLER ---
          if (prefs.provider === 'gemini') {
            const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("Server Error: Missing Google API Key");

            const ai = new GoogleGenAI({ apiKey });
            
            // Use stream to prevent timeout
            const response = await ai.models.generateContentStream({
              model: "gemini-3-flash-preview",
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are a world-class travel agent AI. Return valid JSON.",
                responseMimeType: "application/json"
              }
            });

            let gatheredSources = [];
            
            for await (const chunk of response.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
              // Collect grounding metadata
              if (chunk.groundingMetadata?.groundingChunks) {
                 chunk.groundingMetadata.groundingChunks.forEach(c => {
                   if (c.web?.uri && c.web?.title) {
                     gatheredSources.push({ title: c.web.title, url: c.web.uri });
                   }
                 });
              }
            }
            
            // Append sources at the very end using a custom delimiter
            controller.enqueue(encoder.encode(`\n\n__SOURCES__:${JSON.stringify(gatheredSources)}`));
          
          } 
          // --- SILICONFLOW HANDLER ---
          else if (prefs.provider === 'siliconflow') {
            const apiKey = process.env.SILICONFLOW_API_KEY;
            if (!apiKey) throw new Error("Server Error: Missing SiliconFlow API Key");

            const openai = new OpenAI({
              apiKey: apiKey,
              baseURL: "https://api.siliconflow.cn/v1" 
            });

            const completion = await openai.chat.completions.create({
              model: "deepseek-ai/DeepSeek-V3", 
              messages: [
                { role: "system", content: "You are a world-class travel agent AI. Always return valid JSON." },
                { role: "user", content: prompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.7,
              stream: true, // Enable streaming
            });

            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content || "";
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
            // Append empty sources for consistency
            controller.enqueue(encoder.encode(`\n\n__SOURCES__:[]`));
          } else {
             throw new Error("Invalid Provider");
          }

          controller.close();
        } catch (err) {
          // If error occurs during stream, we can't easily change status code, 
          // but we can send an error message in body if needed.
          // For now, we just close with error to abort stream.
          console.error("Stream Error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
