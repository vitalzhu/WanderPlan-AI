
import { TravelPreferences, TravelPlan, Language, SearchSource, TimeBlock, LogisticsBlock, TravelConsiderations, SouvenirsInfo } from "../types";

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

const sanitizeTimeBlock = (val: any): TimeBlock => ({
    title: sanitizeString(val?.title),
    content: sanitizeString(val?.content),
    tips: sanitizeString(val?.tips),
});

const sanitizeLogistics = (val: any): LogisticsBlock => ({
    driving: sanitizeString(val?.driving),
    dining: sanitizeString(val?.dining),
    accommodation: sanitizeString(val?.accommodation),
});

const sanitizeConsiderations = (val: any): TravelConsiderations => ({
    documents: sanitizeString(val?.documents),
    culture_customs: sanitizeString(val?.culture_customs),
    health_safety: sanitizeString(val?.health_safety),
    laws_regulations: sanitizeString(val?.laws_regulations),
});

const sanitizeSouvenirs = (val: any): SouvenirsInfo => ({
    items: sanitizeArray(val?.items),
    final_wishes: sanitizeString(val?.final_wishes),
});

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
            theme: sanitizeString(day.theme),
            morning: sanitizeTimeBlock(day.morning),
            afternoon: sanitizeTimeBlock(day.afternoon),
            evening: sanitizeTimeBlock(day.evening),
            logistics: sanitizeLogistics(day.logistics),
        })),
        considerations: sanitizeConsiderations(rawJson.considerations),
        souvenirs: sanitizeSouvenirs(rawJson.souvenirs),
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

// Progress detection helper
const detectProgress = (text: string, language: Language): string | null => {
    // Check for Day markers in the raw JSON string
    const dayMatch = text.match(/"day"\s*:\s*(\d+)/g);
    if (dayMatch) {
        // Get the last matched day
        const lastDay = dayMatch[dayMatch.length - 1].match(/\d+/);
        if (lastDay) {
            return language === 'zh' ? `正在规划第 ${lastDay[0]} 天...` : `Planning Day ${lastDay[0]}...`;
        }
    }
    
    // Check for section markers
    if (text.includes('"souvenirs"')) return language === 'zh' ? "正在整理特产清单..." : "Finalizing souvenirs...";
    if (text.includes('"considerations"')) return language === 'zh' ? "正在查询注意事项..." : "Checking travel tips...";
    if (text.includes('"weather_info"')) return language === 'zh' ? "正在分析天气..." : "Analyzing weather...";
    
    return null;
};

export const generateItinerary = async (
    prefs: TravelPreferences, 
    language: Language, 
    feedback?: string,
    onProgress?: (msg: string) => void
): Promise<TravelPlan> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefs, language, feedback }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server Error: ${response.status}`);
    }

    if (!response.body) {
        throw new Error("No response body received");
    }

    // Handle Streaming Response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let lastProgressMsg = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        // Try to update progress based on content
        if (onProgress) {
            const msg = detectProgress(fullText, language);
            if (msg && msg !== lastProgressMsg) {
                lastProgressMsg = msg;
                onProgress(msg);
            }
        }
    }
    
    // Split the sources from the JSON text
    // Format is: [JSON_TEXT]\n\n__SOURCES__:[JSON_SOURCES]
    const splitKey = "\n\n__SOURCES__:";
    const splitIndex = fullText.lastIndexOf(splitKey);
    
    let text = fullText;
    let sources: SearchSource[] = [];

    if (splitIndex !== -1) {
        text = fullText.substring(0, splitIndex);
        try {
            const sourcesJson = fullText.substring(splitIndex + splitKey.length);
            sources = JSON.parse(sourcesJson);
        } catch (e) {
            console.warn("Failed to parse sources from stream", e);
        }
    }

    // Basic cleanup of markdown
    text = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
    
    // Handle potential wrapper text to extract just the JSON object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    const rawResult = JSON.parse(text);
    return processJsonResponse(rawResult, prefs, sources);

  } catch (error) {
    console.error("API Call Failed:", error);
    throw error;
  }
};
