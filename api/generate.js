
import OpenAI from "openai";
import { SILICONFLOW_API_KEY, SILICONFLOW_BASE_URL, SILICONFLOW_MODEL } from './config.js';

export const config = {
  runtime: 'edge',
};

const generatePrompt = (prefs, language, feedback) => {
  const langName = language === 'zh' ? 'Chinese (Simplified)' : 'English';
  const currentDate = new Date().toISOString().split('T')[0];
  const stopovers = prefs.waypoints.length > 0 ? prefs.waypoints.join(', ') : "None";
  const avoidList = prefs.avoid.length > 0 ? prefs.avoid.join(', ') : "None";

  const feedbackInstruction = feedback ? `
    *** IMPORTANT REGENERATION INSTRUCTION ***
    The user wants to REGENERATE the itinerary based on the following feedback:
    "${feedback}"
    
    You must ADJUST the itinerary to strictly address this feedback. 
    If the feedback contradicts the original preferences below, prioritize the feedback.
    ******************************************
  ` : "";

  return `
    Act as a senior travel planner. Create a ${prefs.days}-day trip to ${prefs.destination} for a ${prefs.companions} trip (${prefs.travelers} people).
    
    ${feedbackInstruction}

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
    - Do NOT use bullet points for the main content. Use continuous, engaging sentences to describe the experience, emotions, and scenery.
    - Focus on **sensory details**: what to see, hear, smell, and feel.

    CRITICAL TASKS:
    1. **Route Planning**: Organize the route logically to minimize backtracking and include all stopovers (${stopovers}).
    2. **Logistical Continuity**: For every day (except Day 1), you MUST explicitly state the travel logic from the *Previous Day's* location to *Today's* location.
    3. **Weather**: Estimate historical weather averages for ${prefs.destination} during ${prefs.startDate} to ${prefs.endDate}.
    4. **Travel Info Search**: Find requirements for documents, customs, health, laws, and souvenirs.

    Structure per Day:
    1. **Morning**:
       - 'title': The main location or activity name.
       - 'content': **MANDATORY TRANSIT BRIDGE**: You MUST start the text by connecting from the previous location. 
         Format requirement: "Today we depart from [Previous Day's Location] to [Today's Destination], covering approx [X] km ([Y] hours). We recommend starting at [Time, e.g. 8:00 AM] to arrive by [Time] for [Lunch/Local Feature]."
         AFTER this sentence, continue with the immersive narrative of the destination and morning activity (total 80-100 words).
       - 'tips': "Warm Tips" (温馨提示).
    2. **Afternoon/Evening**:
       - 'title': The main location or activity name.
       - 'content': A detailed, immersive narrative paragraph (approx 60-80 words). Describe the atmosphere, specific sights, sounds, and emotions.
       - 'tips': Specific advice.
    3. **Logistics**:
       - 'driving': Km and time (e.g. "270KM, approx 4h").
       - 'dining': Breakfast/Lunch/Dinner arrangement.
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
      "considerations": {
        "documents": "Required IDs, Visas, or Border Permits.",
        "culture_customs": "Local taboos, etiquette, or cultural norms.",
        "health_safety": "Altitude sickness, vaccinations, safety tips.",
        "laws_regulations": "Drone rules, driving regulations, or other laws."
      },
      "souvenirs": {
        "items": ["List of 3-5 specific local specialties"],
        "final_wishes": "A warm closing sentence blessing the traveler."
      },
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
    const { prefs, language, feedback } = await req.json();
    const prompt = generatePrompt(prefs, language, feedback);
    const encoder = new TextEncoder();

    if (!SILICONFLOW_API_KEY) throw new Error("Server Error: Missing SiliconFlow API Key");

    const openai = new OpenAI({
      apiKey: SILICONFLOW_API_KEY,
      baseURL: SILICONFLOW_BASE_URL
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: SILICONFLOW_MODEL, 
            messages: [
              { role: "system", content: "You are a world-class travel agent AI. Always return valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            stream: true, 
          });

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          
          // Append empty sources since DeepSeek doesn't support grounding metadata in this flow
          controller.enqueue(encoder.encode(`\n\n__SOURCES__:[]`));
          
          controller.close();
        } catch (err) {
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
