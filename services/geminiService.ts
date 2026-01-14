import { GoogleGenAI } from "@google/genai";
import { TravelPreferences, TravelPlan, Language, SearchSource } from "../types";

const generatePrompt = (prefs: TravelPreferences, language: Language): string => {
  const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const currentDate = new Date().toISOString().split('T')[0];
  const stopovers = prefs.waypoints.length > 0 ? prefs.waypoints.join(', ') : "None";
  const avoidList = prefs.avoid.length > 0 ? prefs.avoid.join(', ') : "None";
  
  const isCampingTrip = prefs.styles.includes('Long-distance Camping');

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
       - USE GOOGLE SEARCH to find the historical weather average or forecast (if dates are close) for ${prefs.destination} during the trip dates (${prefs.startDate}).
       - Provide SPECIFIC temperature ranges (e.g., 20-25°C), general weather conditions (e.g., Sunny, Rainy, Cloudy), humidity levels (e.g., Low, High, 80%), and clothing advice based on this search.
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

// Helper to ensure values are strings
const sanitizeString = (val: unknown): string => {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map(v => sanitizeString(v)).join(', ');
  if (typeof val === 'object' && val !== null) {
      return Object.values(val).map(v => sanitizeString(v)).join(' ');
  }
  return '';
};

const sanitizeArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(v => sanitizeString(v));
    if (typeof val === 'string') return [val];
    return [];
};

// Helper to process API response
const processResponse = (response: any, prefs: TravelPreferences): TravelPlan => {
    const text = response.text;
    if (!text) {
        throw new Error("No response from AI");
    }

    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    
    const rawResult = JSON.parse(cleanText);

    const result: TravelPlan = {
        overview: {
            trip_theme: sanitizeString(rawResult.overview?.trip_theme),
            total_days: Number(rawResult.overview?.total_days) || prefs.days,
            cities: sanitizeArray(rawResult.overview?.cities),
            pace: sanitizeString(rawResult.overview?.pace),
            best_for: sanitizeArray(rawResult.overview?.best_for)
        },
        weather_info: {
            temperature_range: sanitizeString(rawResult.weather_info?.temperature_range),
            weather_condition: sanitizeString(rawResult.weather_info?.weather_condition),
            humidity: sanitizeString(rawResult.weather_info?.humidity),
            clothing_advice: sanitizeString(rawResult.weather_info?.clothing_advice)
        },
        daily_plan: (Array.isArray(rawResult.daily_plan) ? rawResult.daily_plan : []).map((day: any) => ({
            day: Number(day.day),
            city: sanitizeString(day.city),
            morning: sanitizeString(day.morning),
            afternoon: sanitizeString(day.afternoon),
            evening: sanitizeString(day.evening),
            notes: sanitizeString(day.notes),
            plan_b: sanitizeString(day.plan_b)
        })),
        must_book_in_advance: sanitizeArray(rawResult.must_book_in_advance),
        accommodation_tips: sanitizeString(rawResult.accommodation_tips),
        transport_tips: sanitizeString(rawResult.transport_tips),
        final_advice: sanitizeString(rawResult.final_advice)
    };

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const sources: SearchSource[] = [];
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
                sources.push({
                    title: chunk.web.title,
                    url: chunk.web.uri
                });
            }
        });
        const uniqueSources = Array.from(new Map(sources.map(item => [item.url, item])).values());
        if (uniqueSources.length > 0) {
            result.search_sources = uniqueSources;
        }
    }

    return result;
};

export const generateItinerary = async (prefs: TravelPreferences, language: Language): Promise<TravelPlan> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sysInstruction = "You are a world-class travel agent AI. You prioritize realistic, enjoyable itineraries over packed checklists. You MUST use Google Search to get accurate weather information. Always return valid JSON.";
  const fallbackSysInstruction = "You are a world-class travel agent AI. You prioritize realistic, enjoyable itineraries over packed checklists. Provide your best estimate for weather information based on your knowledge. Always return valid JSON.";

  const prompt = generatePrompt(prefs, language);

  try {
    // Attempt 1: With Google Search
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                systemInstruction: sysInstruction,
            }
        });
        return processResponse(response, prefs);
    } catch (firstError: any) {
        // Check for common network/RPC errors often caused by tools in certain environments
        console.warn("Gemini API (with Search) failed, retrying without search tools...", firstError);
        
        // Attempt 2: Without Search (Fallback)
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                // No tools
                systemInstruction: fallbackSysInstruction,
            }
        });
        return processResponse(response, prefs);
    }
  } catch (error) {
    console.error("Gemini API Fatal Error:", error);
    throw error;
  }
};