
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

// Narrative Time Block
export interface TimeBlock {
  title: string;       // e.g. "Zhaosu Wetland Park"
  content: string;     // Narrative description (Breakfast, travel, experience...)
  tips: string;        // "Warm Tips" / Seasonal info / Warnings
}

// Logistics Block (Footer)
export interface LogisticsBlock {
  driving: string;       // e.g. "270KM, approx 4h"
  dining: string;        // e.g. "Hotel Breakfast, Lunch on road, Dinner at..."
  accommodation: string; // e.g. "Zhaosu Wanghu Manor (Cabin)"
}

export interface DayPlan {
  day: number;
  city: string;          // Main city/hub
  theme: string;         // Daily Theme
  morning: TimeBlock;
  afternoon: TimeBlock;
  evening: TimeBlock;
  logistics: LogisticsBlock;
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

export interface TravelConsiderations {
  documents: string;       // ID card, Passport, Border permit
  culture_customs: string; // Local taboos, etiquette
  health_safety: string;   // Altitude sickness, water safety, etc.
  laws_regulations: string; // Drone laws, driving rules
}

export interface SouvenirsInfo {
  items: string[];
  final_wishes: string;
}

export interface SearchSource {
  title: string;
  url: string;
}

export interface TravelPlan {
  overview: TripOverview;
  weather_info: WeatherInfo;
  daily_plan: DayPlan[];
  considerations: TravelConsiderations;
  souvenirs: SouvenirsInfo;
  must_book_in_advance: string[];
  accommodation_tips: string;
  transport_tips: string;
  final_advice: string;
  search_sources?: SearchSource[];
}
