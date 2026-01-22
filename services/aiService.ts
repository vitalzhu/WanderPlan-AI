import { TravelPreferences, TravelPlan, Language, SearchSource } from "../types";

// Helper to sanitize the response string into a clean JSON object
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

const processJsonResponse = (rawJson: any, prefs: TravelPreferences, sources?: SearchSource[]): TravelPlan => {
    const result: TravelPlan = {
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

    if (sources && sources.length > 0) {
        // Deduplicate
        const uniqueSources = Array.from(new Map(sources.map(item => [item.url, item])).values());
        result.search_sources = uniqueSources;
    }

    return result;
};

export const generateItinerary = async (prefs: TravelPreferences, language: Language): Promise<TravelPlan> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefs, language }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.text;
    
    // Basic cleanup of markdown if the server returns it
    text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    
    // Handle potential wrapper text
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    const rawResult = JSON.parse(text);
    return processJsonResponse(rawResult, prefs, data.sources);

  } catch (error) {
    console.error("API Call Failed:", error);
    throw error;
  }
};
