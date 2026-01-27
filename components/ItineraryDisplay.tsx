
import React, { useState, useEffect } from 'react';
import { TravelPlan, Language, TimeBlock, LogisticsBlock, WeatherInfo, TravelConsiderations, SouvenirsInfo } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Copy, Check, Bus, BedDouble, Info, FileText, Printer, Thermometer, Shirt, ExternalLink, Edit2, Save, X, ArrowLeft, CloudSun, Droplets, Target, Lightbulb, Ticket, Backpack, Moon, Sun, Utensils, Car, Star, Navigation, Shield, Gavel, Gift, Heart, FileWarning, Sparkles, MessageSquare, Send, ThumbsUp, RefreshCw, Sparkle } from 'lucide-react';

interface ItineraryDisplayProps {
  plan: TravelPlan;
  onReset: () => void;
  onBack: () => void;
  onRegenerate: (feedback: string) => void;
  language: Language;
}

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ plan: initialPlan, onReset, onBack, onRegenerate, language }) => {
  const [expandedDay, setExpandedDay] = useState<number | 'ALL' | null>(1);
  const [plan, setPlan] = useState<TravelPlan>(initialPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<TravelPlan>(initialPlan);
  const [copied, setCopied] = useState(false);
  
  // Feedback State
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setPlan(initialPlan);
    setEditedPlan(initialPlan);
    setFeedbackSubmitted(false);
    setRating(0);
    setFeedback('');
  }, [initialPlan]);

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const handleEditToggle = () => {
    if (isEditing) {
        setEditedPlan(plan);
        setIsEditing(false);
    } else {
        setEditedPlan(JSON.parse(JSON.stringify(plan)));
        setExpandedDay('ALL');
        setIsEditing(true);
    }
  };

  const handleSave = () => {
    setPlan(editedPlan);
    setIsEditing(false);
    setExpandedDay(1);
  };

  const handleFeedbackSubmit = () => {
      // In a real app, send to backend here
      console.log('Feedback submitted:', { rating, feedback });
      setFeedbackSubmitted(true);
  };

  // Generic handler for nested fields
  const handleNestedChange = (dayIndex: number, section: 'morning' | 'afternoon' | 'evening' | 'logistics', field: string, value: string) => {
      const newDailyPlan = [...editedPlan.daily_plan];
      const sectionData = newDailyPlan[dayIndex][section] as any;
      newDailyPlan[dayIndex] = {
          ...newDailyPlan[dayIndex],
          [section]: {
              ...sectionData,
              [field]: value
          }
      };
      setEditedPlan({ ...editedPlan, daily_plan: newDailyPlan });
  };

  const handleWeatherChange = (field: keyof WeatherInfo, value: string) => {
      setEditedPlan({
          ...editedPlan,
          weather_info: {
              ...editedPlan.weather_info,
              [field]: value
          }
      });
  };

  const handleConsiderationChange = (field: keyof TravelConsiderations, value: string) => {
      setEditedPlan({
          ...editedPlan,
          considerations: {
              ...editedPlan.considerations,
              [field]: value
          }
      });
  };

   const handleSouvenirChange = (field: 'final_wishes' | 'items', value: string | string[]) => {
      setEditedPlan({
          ...editedPlan,
          souvenirs: {
              ...editedPlan.souvenirs,
              [field]: value
          }
      });
  };

  const generateTextContent = () => {
      return JSON.stringify(plan, null, 2); 
  };

  const handleCopy = () => {
    const text = generateTextContent();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportText = () => {
    const text = generateTextContent();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WanderPlan_Itinerary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const prev = expandedDay;
    setExpandedDay('ALL');
    setTimeout(() => {
        window.print();
        setExpandedDay(prev);
    }, 500);
  };

  const currentPlan = isEditing ? editedPlan : plan;

  // Render a Time Block as part of a timeline
  const TimelineSection = ({ 
      title, 
      data, 
      icon: Icon, 
      colorClass, // text-amber-500
      bgClass,    // bg-amber-50
      ringClass,  // ring-amber-100
      dayIndex, 
      section,
      isLast
  }: { 
      title: string, 
      data: TimeBlock, 
      icon: any, 
      colorClass: string,
      bgClass: string,
      ringClass: string,
      dayIndex: number, 
      section: 'morning' | 'afternoon' | 'evening',
      isLast?: boolean
  }) => {
      return (
          <div className="relative pl-8 sm:pl-12 pb-8 last:pb-2">
              {/* Timeline Line */}
              {!isLast && (
                  <div className="absolute left-[15px] sm:left-[19px] top-10 bottom-0 w-0.5 bg-slate-200/60"></div>
              )}
              
              {/* Icon Marker */}
              <div className={`absolute left-0 top-1 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ring-4 ring-white z-10 shadow-sm ${bgClass} ${colorClass}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>

              {/* Content Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-opacity-10 ${bgClass} ${colorClass}`}>{title}</span>
                  {isEditing ? (
                       <input 
                         value={data.title}
                         onChange={(e) => handleNestedChange(dayIndex, section, 'title', e.target.value)}
                         className="flex-1 text-base font-bold bg-slate-50 border-b border-slate-300 focus:border-indigo-500 outline-none px-1"
                       />
                  ) : (
                       <h4 className="text-base font-bold text-slate-800">{data.title}</h4>
                  )}
              </div>
              
              {/* Main Content */}
              <div className="text-[15px] sm:text-base text-slate-700 leading-relaxed space-y-4">
                  {isEditing ? (
                      <textarea 
                        value={data.content}
                        onChange={(e) => handleNestedChange(dayIndex, section, 'content', e.target.value)}
                        className="w-full min-h-[160px] p-4 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none resize-y"
                      />
                  ) : (
                      <p className="whitespace-pre-wrap">{data.content}</p>
                  )}

                  {/* Tips Box */}
                  {(data.tips || isEditing) && (
                      <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-100 flex gap-3 text-amber-900/80 mt-4">
                          <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5 fill-amber-100" />
                          <div className="flex-1">
                              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide block mb-1">{t.warmTips}</span>
                              {isEditing ? (
                                  <textarea 
                                    value={data.tips}
                                    onChange={(e) => handleNestedChange(dayIndex, section, 'tips', e.target.value)}
                                    className="w-full text-sm bg-transparent border-b border-amber-200 outline-none text-slate-700 placeholder-amber-300"
                                    placeholder="Add tips..."
                                  />
                              ) : (
                                  <p className="text-sm">{data.tips}</p>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 font-sans">
      
      {/* Overview Card */}
      <div className="group relative bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-white overflow-hidden no-print ring-1 ring-slate-100">
        <div className="relative overflow-hidden bg-slate-900 text-white p-8 sm:p-10">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30 -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20 translate-y-1/3 -translate-x-1/4"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                    <button onClick={onBack} className="group flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {t.backToSearch}
                    </button>
                    <button onClick={onReset} className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all backdrop-blur-md border border-white/5">
                        {t.newTrip}
                    </button>
                </div>
                
                <div className="mt-auto">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {currentPlan.overview.best_for.map((tag, i) => (
                             <span key={i} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-white/10 text-indigo-100 rounded border border-white/10 backdrop-blur-sm">{tag}</span>
                        ))}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 pb-2">
                        {currentPlan.overview.trip_theme}
                    </h1>
                    
                    <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
                        <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5"><MapPin className="w-4 h-4 text-indigo-400" /> {currentPlan.overview.cities.join(' · ')}</span>
                        <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5"><Clock className="w-4 h-4 text-fuchsia-400" /> {currentPlan.overview.total_days} {t.daysUnit}</span>
                        <span className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5"><Users className="w-4 h-4 text-sky-400" /> {currentPlan.overview.pace}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Action Bar inside Overview */}
        <div className="bg-white px-6 py-3 flex justify-end border-t border-slate-100">
             <div className="flex items-center gap-2">
                 {!isEditing ? (
                     <button onClick={handleEditToggle} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full text-xs font-bold transition-colors uppercase tracking-wide">
                        <Edit2 className="w-3.5 h-3.5" /> {t.edit}
                     </button>
                 ) : (
                     <div className="flex items-center gap-2">
                        <button onClick={handleEditToggle} className="text-xs font-bold px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-full">{t.cancel}</button>
                        <button onClick={handleSave} className="text-xs font-bold px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-200 flex items-center gap-1.5"><Save className="w-3.5 h-3.5"/> {t.save}</button>
                     </div>
                 )}
             </div>
        </div>
      </div>

      {/* Weather Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <CloudSun className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t.weatherTitle}</h3>
        </div>
        
        <div className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { icon: Thermometer, label: t.temperature, value: currentPlan.weather_info.temperature_range, key: 'temperature_range', color: 'text-orange-500', bg: 'bg-orange-50' },
                    { icon: CloudSun, label: t.weatherCondition, value: currentPlan.weather_info.weather_condition, key: 'weather_condition', color: 'text-sky-500', bg: 'bg-sky-50' },
                    { icon: Droplets, label: t.humidity, value: currentPlan.weather_info.humidity, key: 'humidity', color: 'text-blue-500', bg: 'bg-blue-50' }
                ].map((item, i) => (
                    <div key={i} className={`bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center gap-1.5 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
                        <div className="flex items-center gap-2 text-slate-400">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                        </div>
                        {isEditing ? (
                            <input value={item.value} onChange={e => handleWeatherChange(item.key as any, e.target.value)} className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none font-bold text-slate-800 text-sm" />
                        ) : (
                            <p className="font-bold text-slate-800 text-sm leading-tight">{item.value}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Clothing Advice */}
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
                 <div className="flex items-center gap-2 mb-2 text-indigo-500">
                    <Shirt className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t.clothing}</span>
                </div>
                 {isEditing ? (
                    <textarea value={currentPlan.weather_info.clothing_advice} onChange={e => handleWeatherChange('clothing_advice', e.target.value)} className="w-full bg-transparent border border-indigo-200 rounded p-2 text-sm focus:border-indigo-500 outline-none font-medium text-slate-700 min-h-[60px] resize-none" />
                ) : (
                    <p className="font-medium text-slate-700 text-sm leading-relaxed">{currentPlan.weather_info.clothing_advice}</p>
                )}
            </div>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="space-y-6">
        {currentPlan.daily_plan.map((day, index) => {
          const isOpen = expandedDay === 'ALL' || expandedDay === day.day;
          return (
            <div key={day.day} className={`bg-white rounded-3xl border transition-all duration-300 print:border-0 print:shadow-none print:break-inside-avoid overflow-hidden ${isEditing ? 'ring-2 ring-indigo-50 border-indigo-100' : 'border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100'}`}>
              
              {/* Day Header */}
              <button 
                onClick={() => toggleDay(day.day)}
                className="w-full text-left group no-print outline-none"
              >
                <div className={`px-6 sm:px-8 py-6 flex items-start gap-5 transition-colors ${isOpen ? 'bg-white' : 'hover:bg-slate-50/80'}`}>
                    {/* Date Badge */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${isOpen ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-400'}`}>
                        <span className="text-[9px] uppercase font-bold tracking-widest opacity-60 mb-0.5">Day</span>
                        <span className="text-2xl font-black leading-none tracking-tight">{day.day}</span>
                    </div>
                    
                    {/* Header Text */}
                    <div className="flex-1 min-w-0 py-1">
                         <div className="flex justify-between items-center mb-1">
                             <h3 className={`text-xl font-bold truncate pr-4 transition-colors ${isOpen ? 'text-slate-900' : 'text-slate-700 group-hover:text-indigo-900'}`}>{day.city}</h3>
                             <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                 <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                             </div>
                         </div>
                         <p className="text-sm font-medium text-slate-500 truncate">{day.theme}</p>
                    </div>
                </div>
              </button>

              {/* Print Header */}
              <div className="hidden print:block p-6 border-b border-slate-100">
                 <h3 className="text-2xl font-bold text-slate-900">Day {day.day} - {day.city}</h3>
                 <p className="text-slate-500">{day.theme}</p>
              </div>

              {isOpen && (
                <div className="animate-fade-in">
                    {/* Main Content Area */}
                    <div className="px-6 sm:px-8 pb-4">
                         {/* Timeline Container */}
                         <div className="mt-4">
                            {/* Morning */}
                            <TimelineSection 
                                title={t.morning} 
                                data={day.morning} 
                                icon={Sun} 
                                colorClass="text-amber-500" 
                                bgClass="bg-amber-50"
                                ringClass="ring-amber-50"
                                dayIndex={index} 
                                section="morning" 
                            />
                            
                            {/* Afternoon */}
                            <TimelineSection 
                                title={t.afternoon} 
                                data={day.afternoon} 
                                icon={CloudSun} 
                                colorClass="text-sky-500" 
                                bgClass="bg-sky-50"
                                ringClass="ring-sky-50"
                                dayIndex={index} 
                                section="afternoon" 
                            />
                            
                            {/* Evening */}
                            <TimelineSection 
                                title={t.evening} 
                                data={day.evening} 
                                icon={Moon} 
                                colorClass="text-indigo-500" 
                                bgClass="bg-indigo-50"
                                ringClass="ring-indigo-50"
                                dayIndex={index} 
                                section="evening" 
                                isLast={true}
                            />
                         </div>
                    </div>

                    {/* Logistics Dashboard */}
                    <div className="mx-4 mb-4 sm:mx-6 sm:mb-6 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.logistics}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                            {[
                                { icon: Car, label: t.driving, value: day.logistics.driving, key: 'driving' },
                                { icon: Utensils, label: t.dining, value: day.logistics.dining, key: 'dining' },
                                { icon: BedDouble, label: t.stay, value: day.logistics.accommodation, key: 'accommodation' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 items-start group/item">
                                    <div className="mt-0.5 text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{item.label}</span>
                                        {isEditing ? (
                                            <input value={item.value} onChange={e => handleNestedChange(index, 'logistics', item.key as any, e.target.value)} className="bg-transparent border-b border-slate-300 w-full text-sm font-medium" />
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-700 leading-tight">{item.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Combined Trip Essentials & Memories Card */}
      {(currentPlan.considerations || currentPlan.souvenirs) && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden no-print transition-all hover:shadow-md ring-1 ring-slate-100/50">
            <div className="p-6 sm:p-8 pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{t.tripEssentialsTitle}</h3>
                </div>
            </div>
            
            <div className="p-6 sm:p-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left Column: Considerations */}
                {currentPlan.considerations && (
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-2.5 font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
                            <Shield className="w-4 h-4 text-rose-500" />
                            {t.attention}
                        </h4>
                        
                        <div className="space-y-4">
                            {[
                                { label: t.documents, value: currentPlan.considerations.documents, icon: FileText, key: 'documents' },
                                { label: t.cultureCustoms, value: currentPlan.considerations.culture_customs, icon: Users, key: 'culture_customs' },
                                { label: t.healthSafety, value: currentPlan.considerations.health_safety, icon: FileWarning, key: 'health_safety' },
                            ].map((item, i) => (
                                <div key={i} className="group">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
                                    </div>
                                    <div className="pl-5.5 border-l-2 border-slate-100 pl-3 py-1 group-hover:border-rose-100 transition-colors">
                                        {isEditing ? (
                                            <textarea value={item.value} onChange={e => handleConsiderationChange(item.key as any, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm outline-none" rows={2} />
                                        ) : (
                                            <p className="text-sm text-slate-600 leading-relaxed">{item.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right Column: Souvenirs & Wishes */}
                {currentPlan.souvenirs && (
                    <div className="flex flex-col h-full">
                        <div className="space-y-6 flex-1">
                            <h4 className="flex items-center gap-2.5 font-bold text-slate-800 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
                                <Gift className="w-4 h-4 text-purple-500" />
                                {t.souvenirsTitle}
                            </h4>

                            <div>
                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star className="w-3 h-3" /> {t.specialties}</h5>
                                <div className="flex flex-wrap gap-2">
                                    {currentPlan.souvenirs.items.map((item, idx) => (
                                        <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-100/50 shadow-sm flex items-center gap-1.5">
                                            {isEditing ? (
                                                <input 
                                                    value={item} 
                                                    onChange={(e) => {
                                                        const newItems = [...currentPlan.souvenirs.items];
                                                        newItems[idx] = e.target.value;
                                                        handleSouvenirChange('items', newItems);
                                                    }}
                                                    className="bg-transparent outline-none w-24 min-w-0"
                                                />
                                            ) : item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Wishes */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">
                                <Heart className="w-4 h-4 text-pink-500" />
                                {t.bestWishes}
                            </h4>
                             <div className="relative bg-pink-50/50 p-5 rounded-2xl border border-pink-100/50">
                                <span className="absolute top-4 left-3 text-3xl text-pink-200 font-serif leading-none">"</span>
                                {isEditing ? (
                                    <textarea 
                                        value={currentPlan.souvenirs.final_wishes} 
                                        onChange={(e) => handleSouvenirChange('final_wishes', e.target.value)}
                                        className="w-full bg-white/50 border border-pink-200 rounded p-2 text-base italic font-serif text-slate-700 outline-none"
                                        rows={3}
                                    />
                                ) : (
                                    <p className="text-base italic font-serif text-slate-700 leading-relaxed pl-3 relative z-10">{currentPlan.souvenirs.final_wishes}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Sources - Simplified */}
      {currentPlan.search_sources && currentPlan.search_sources.length > 0 && (
          <div className="mt-12 border-t border-slate-200 pt-8 no-print px-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ExternalLink className="w-3 h-3" /> {t.sources}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {currentPlan.search_sources.map((source, index) => (
                    <a key={index} href={source.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                        <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-400 mt-1.5 shrink-0"></span>
                        <span className="truncate">{source.title}</span>
                    </a>
                ))}
            </div>
          </div>
      )}
      
      {/* Unified Feedback & Regenerate Section */}
      <div className="mt-12 mb-8 no-print animate-fade-in-up">
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-1">
            
            {/* Decorative background gradients */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center">
                
                {!feedbackSubmitted ? (
                    <>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{t.feedbackTitle}</h3>
                        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                            {t.feedbackSubtitle}
                        </p>

                        {/* Stars */}
                        <div className="flex gap-3 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    onClick={() => setRating(star)}
                                    className="group focus:outline-none transition-all duration-200 hover:scale-110"
                                >
                                    <Star 
                                        className={`w-8 h-8 transition-colors duration-200 ${
                                            star <= rating 
                                            ? 'fill-amber-400 text-amber-400 drop-shadow-sm' 
                                            : 'text-slate-200 group-hover:text-slate-300'
                                        }`} 
                                        strokeWidth={star <= rating ? 0 : 1.5}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="w-full max-w-lg relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder={t.feedbackPlaceholder}
                                className="relative w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 outline-none resize-none h-32 transition-all text-sm leading-relaxed"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full max-w-lg">
                            {/* Submit Review Only */}
                            <button 
                                onClick={handleFeedbackSubmit}
                                disabled={rating === 0}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                                    rating > 0 
                                    ? 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300' 
                                    : 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                                {t.submitFeedback}
                            </button>

                            {/* Regenerate with Feedback */}
                            <button 
                                onClick={() => onRegenerate(feedback)}
                                className="flex-[1.5] flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-200 transition-all duration-200 bg-slate-900 hover:bg-indigo-600 hover:shadow-indigo-300 transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {t.regenerateOption}
                            </button>
                        </div>
                        
                        <p className="mt-4 text-xs text-slate-400 max-w-xs mx-auto">
                            {t.regenerateDesc}
                        </p>
                    </>
                ) : (
                    <div className="py-12 animate-fade-in flex flex-col items-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-green-100 mb-6">
                            <ThumbsUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{t.feedbackThanks}</h3>
                        <p className="text-slate-500 mb-8 max-w-sm">
                           We appreciate your input! You can still regenerate the plan if you wish to try a different variation.
                        </p>
                        
                        <button 
                            onClick={() => {
                                setFeedbackSubmitted(false);
                                onRegenerate(feedback);
                            }}
                            className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t.regenerateOption}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Action Bar */}
      {!isEditing && (
        <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-3 no-print">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-xl shadow-slate-200/50 border border-white/50 ring-1 ring-slate-200">
                <button onClick={handlePrint} title={t.exportPDF} className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><Printer className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button onClick={handleExportText} title={t.exportText} className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><FileText className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button onClick={handleCopy} title={t.copy} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${copied ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300'}`}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t.copied : t.copyText}
                </button>
            </div>
        </div>
      )}

    </div>
  );
};
