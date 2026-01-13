import { Coffee, Camera, Landmark, Mountain, Utensils, Zap, Sunset, Users, User, Baby, SmilePlus, Wallet, Banknote, CreditCard, Heart, Train, Car, Plane, ShoppingBag, Moon,  Flag, Footprints, Tent } from 'lucide-react';
import { Language } from './types';

export const TRAVEL_STYLES = [
  { id: 'Relaxing', label: { en: 'Relaxing', zh: '休闲放松' }, icon: Coffee },
  { id: 'Food-focused', label: { en: 'Foodie', zh: '寻味美食' }, icon: Utensils },
  { id: 'Photography', label: { en: 'Photography', zh: '摄影打卡' }, icon: Camera },
  { id: 'Culture & history', label: { en: 'Culture', zh: '历史文化' }, icon: Landmark },
  { id: 'Outdoor / hiking', label: { en: 'Hiking & Outdoors', zh: '户外徒步' }, icon: Mountain },
  { id: 'Long-distance Camping', label: { en: 'Long-distance Camping', zh: '长线露营' }, icon: Tent },
];

export const AVOID_OPTIONS = [
  { id: 'Crowds', label: { en: 'Crowds & Queues', zh: '人多拥挤' }, icon: Users },
  { id: 'Museums', label: { en: 'Museums', zh: '博物馆' }, icon: Landmark },
  { id: 'Shopping', label: { en: 'Shopping Malls', zh: '购物商圈' }, icon: ShoppingBag },
  { id: 'Nightlife', label: { en: 'Nightlife', zh: '夜生活/酒吧' }, icon: Moon },
  { id: 'Hiking', label: { en: 'Strenuous Hiking', zh: '爬山/剧烈运动' }, icon: Footprints },
  { id: 'Tourist Traps', label: { en: 'Tourist Traps', zh: '网红打卡点' }, icon: Flag },
];

export const PACE_OPTIONS = [
  { id: 'Slow', label: { en: 'Slow', zh: '慢节奏' }, description: { en: 'Leisurely, lots of downtime', zh: '悠闲，享受大量自由时间' }, icon: Sunset },
  { id: 'Balanced', label: { en: 'Balanced', zh: '均衡' }, description: { en: 'Mix of activities and rest', zh: '活动与休息完美平衡' }, icon: SmilePlus },
  { id: 'Intensive', label: { en: 'Intensive', zh: '特种兵' }, description: { en: 'Packed schedule, see it all', zh: '行程紧凑，打卡所有景点' }, icon: Zap },
];

export const TRANSPORT_OPTIONS = [
  { id: 'Public Transit', label: { en: 'Public Transit', zh: '公共交通' }, icon: Train },
  { id: 'Self-driving', label: { en: 'Self-driving', zh: '自驾出行' }, icon: Car },
  { id: 'Private Charter', label: { en: 'Private Charter', zh: '包车游览' }, icon: User },
];

export const COMPANION_OPTIONS = [
  { id: 'Solo', label: { en: 'Solo', zh: '独行' }, icon: User },
  { id: 'Couple', label: { en: 'Couple', zh: '情侣' }, icon: Heart },
  { id: 'Friends', label: { en: 'Friends', zh: '好友' }, icon: Users },
  { id: 'Family (kids)', label: { en: 'Family', zh: '亲子' }, icon: Baby },
  { id: 'Elderly', label: { en: 'Elderly', zh: '携老' }, icon: SmilePlus },
];

export const BUDGET_OPTIONS = [
  { id: 'Budget', label: { en: 'Budget', zh: '经济穷游' }, icon: Wallet },
  { id: 'Mid-range', label: { en: 'Mid-range', zh: '舒适享受' }, icon: Banknote },
  { id: 'Premium', label: { en: 'Premium', zh: '奢华高端' }, icon: CreditCard },
];