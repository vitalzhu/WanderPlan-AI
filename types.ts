
export type Language = 'zh' | 'en';
export type AIProvider = 'gemini' | 'siliconflow';

export interface TravelPreferences {
  destination: string;
  waypoints: string[];
  days: number;
  travelers: number;
  startDate: string;
  endDate: string;
  styles: string[];
  avoid: string[];
  pace: string;
  transportation: string;
  companions: string;
  budget: string;
  customKeywords: string;
  provider: AIProvider;
}

export interface ActivityBlock {
  time: string;
  activity: string;
  description: string;
  why_this_place: string;
  reservation: string;
  items_to_bring: string;
}

export interface DayPlan {
  day: number;
  city: string;
  theme: string; // Added theme
  morning: ActivityBlock;   // Changed from string
  afternoon: ActivityBlock; // Changed from string
  evening: ActivityBlock;   // Changed from string
  notes: string;
  plan_b: string;
}

export interface TripOverview {
  trip_theme: string;
  total_days: number;
  cities: string[];
  pace: string;
  best_for: string[];
}

export interface WeatherInfo {
  temperature_range: string;
  weather_condition: string;
  humidity: string;
  clothing_advice: string;
}

export interface SearchSource {
  title: string;
  url: string;
}

export interface TravelPlan {
  overview: TripOverview;
  weather_info: WeatherInfo;
  daily_plan: DayPlan[];
  must_book_in_advance: string[];
  accommodation_tips: string;
  transport_tips: string;
  final_advice: string;
  search_sources?: SearchSource[];
}
