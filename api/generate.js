
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
    - IMPORTANT: The JSON keys MUST remain in English. Only the values should be in ${langName}.

    Style & Tone:
    - Write in a **Travel Blog / Narrative** style (like a Xiaohongshu/Instagram guide).
    - Do NOT use bullet points for the main content. Use continuous sentences to describe the experience, emotions, and scenery.
    - Example: "After breakfast, the driver will pick you up... We head south to Zhaosu..."

    CRITICAL TASKS:
    1. **Route Planning**: Organize the route logically to minimize backtracking and include all stopovers (${stopovers}).
    2. **Weather Search**: ${isGemini ? `Use Google Search to find the specific weather forecast (if close to ${currentDate}) or historical weather averages for ${prefs.destination} during ${prefs.startDate} to ${prefs.endDate}.` : "Estimate historical weather for the dates."}
       - Based on the weather, provide specific temperature ranges and clothing/footwear advice.

    Structure per Day:
    1. **Morning/Afternoon/Evening**:
       - 'title': The main location or activity name (e.g. "Zhaosu Wetland Park").
       - 'content': A vivid narrative paragraph describing what to do, see, and feel. Mention specific photo spots or interactions.
       - 'tips': "Warm Tips" (温馨提示) - Specific advice about weather, best photo times, ice conditions, or booking requirements. Return empty string if no specific tip.
    2. **Logistics**:
       - 'driving': Km and time (e.g. "270KM, approx 4h").
       - 'dining': Breakfast/Lunch/Dinner arrangement (e.g. "Hotel breakfast, Roadside local food for lunch").
       - 'accommodation': Specific hotel name or area suggestion.

    OUTPUT FORMAT:
    Return a valid JSON object matching this schema:
    {
      "overview": {
        "trip_theme": "string",
        "total_days": number,
        "cities": ["string"],
        "pace": "string",
        "best_for": ["string"]
      },
      "weather_info": {
        "temperature_range": "e.g. -5°C to 10°C",
        "weather_condition": "e.g. Snowy, Sunny, Cloudy",
        "humidity": "e.g. Dry, Medium, High",
        "clothing_advice": "Detailed clothing AND footwear advice based on the temperature."
      },
      "daily_plan": [
        {
          "day": number,
          "city": "string",
          "theme": "string",
          "morning": {
            "title": "string",
            "content": "string",
            "tips": "string"
          },
          "afternoon": {
            "title": "string",
            "content": "string",
            "tips": "string"
          },
          "evening": {
            "title": "string",
            "content": "string",
            "tips": "string"
          },
          "logistics": {
            "driving": "string",
            "dining": "string",
            "accommodation": "string"
          }
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
