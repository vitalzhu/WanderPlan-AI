
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

// Detailed block for Morning (Core Experience)
export interface MorningBlock {
  subtitle: string;
  overview: string;      // 行程概述
  core_experience: string; // 核心体验
  highlights: string;    // 体验亮点
  photo_tips: string;    // 拍摄/观赏建议
  season_tips: string;   // 时间/季节提示
}

// Detailed block for Afternoon (Nature/Supplements)
export interface AfternoonBlock {
  subtitle: string;
  spot_name: string;     // 景点/活动名称
  landscape_features: string; // 景观特点
  play_style: string;    // 游玩方式
  risk_tips: string;     // 风险&不确定性
}

// Detailed block for Evening (Return/Stay)
export interface EveningBlock {
  subtitle: string;
  schedule: string;      // 行程安排
  accommodation_features: string; // 住宿特色
  night_suggestions: string; // 夜间建议
}

// Practical Info Block
export interface PracticalInfo {
  driving_time: string;  // 当日车程
  dining: string;        // 用餐安排
  accommodation: string; // 住宿信息
  physical_rating: string; // 体力消耗
  clothing_gear: string; // 穿着/装备
}

export interface DayPlan {
  day: number;
  city: string;
  theme: string;
  summary: string;       // 一句话概括
  morning: MorningBlock;
  afternoon: AfternoonBlock;
  evening: EveningBlock;
  practical_info: PracticalInfo;
  notes?: string;        // Optional fallback
  plan_b?: string;       // Optional fallback
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
