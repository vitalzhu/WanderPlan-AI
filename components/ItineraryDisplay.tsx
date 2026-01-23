
import React, { useState, useEffect } from 'react';
import { TravelPlan, Language, TimeBlock, LogisticsBlock, WeatherInfo } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Copy, Check, Bus, BedDouble, Info, FileText, Printer, Thermometer, Shirt, ExternalLink, Edit2, Save, X, ArrowLeft, CloudSun, Droplets, Target, Lightbulb, Ticket, Backpack, Moon, Sun, Utensils, Car, Star, Navigation } from 'lucide-react';

interface ItineraryDisplayProps {
  plan: TravelPlan;
  onReset: () => void;
  onBack: () => void;
  language: Language;
}

export const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ plan: initialPlan, onReset, onBack, language }) => {
  const [expandedDay, setExpandedDay] = useState<number | 'ALL' | null>(1);
  const [plan, setPlan] = useState<TravelPlan>(initialPlan);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<TravelPlan>(initialPlan);
  const [copied, setCopied] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setPlan(initialPlan);
    setEditedPlan(initialPlan);
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
      colorClass, // text-amber-500, etc.
      bgClass,    // bg-amber-100, etc.
      dayIndex, 
      section,
      isLast
  }: { 
      title: string, 
      data: TimeBlock, 
      icon: any, 
      colorClass: string,
      bgClass: string,
      dayIndex: number, 
      section: 'morning' | 'afternoon' | 'evening',
      isLast?: boolean
  }) => {
      return (
          <div className="relative pl-8 sm:pl-10 pb-8 last:pb-0">
              {/* Timeline Line */}
              {!isLast && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-slate-100"></div>
              )}
              
              {/* Icon Marker */}
              <div className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white z-10 ${bgClass} ${colorClass}`}>
                  <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content Header */}
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${colorClass}`}>{title}</span>
                  {isEditing ? (
                       <input 
                         value={data.title}
                         onChange={(e) => handleNestedChange(dayIndex, section, 'title', e.target.value)}
                         className="flex-1 text-base font-bold bg-slate-50 border-b border-slate-300 focus:border-indigo-500 outline-none"
                       />
                  ) : (
                       <h4 className="text-base font-bold text-slate-800">{data.title}</h4>
                  )}
              </div>
              
              {/* Main Content */}
              <div className="text-sm text-slate-600 leading-relaxed space-y-3">
                  {isEditing ? (
                      <textarea 
                        value={data.content}
                        onChange={(e) => handleNestedChange(dayIndex, section, 'content', e.target.value)}
                        className="w-full min-h-[100px] p-2 bg-slate-50 rounded border border-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                  ) : (
                      <p className="whitespace-pre-wrap">{data.content}</p>
                  )}

                  {/* Tips Box */}
                  {(data.tips || isEditing) && (
                      <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100 flex gap-3 mt-3">
                          <Lightbulb className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
                          <div className="flex-1">
                              <span className="text-xs font-bold text-orange-600 block mb-1">{t.warmTips}</span>
                              {isEditing ? (
                                  <textarea 
                                    value={data.tips}
                                    onChange={(e) => handleNestedChange(dayIndex, section, 'tips', e.target.value)}
                                    className="w-full text-xs bg-transparent border-b border-orange-200 outline-none text-slate-600"
                                    placeholder="Add tips..."
                                  />
                              ) : (
                                  <p className="text-xs text-slate-600">{data.tips}</p>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="relative overflow-hidden bg-slate-900 text-white p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={onBack} className="group flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        {t.backToSearch}
                    </button>
                    <button onClick={onReset} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm">
                        {t.newTrip}
                    </button>
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold tracking-tight">{currentPlan.overview.trip_theme}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-400" /> {currentPlan.overview.cities.join(' - ')}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> {currentPlan.overview.total_days} {t.daysUnit}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" /> {currentPlan.overview.pace}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Sub-header actions */}
        <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center">
             <div className="flex gap-2">
                 {currentPlan.overview.best_for.map((tag, i) => (
                     <span key={i} className="text-xs font-medium px-2 py-1 bg-slate-50 text-slate-500 rounded-md border border-slate-100">{tag}</span>
                 ))}
             </div>
             <div className="flex items-center gap-2">
                 {!isEditing ? (
                     <button onClick={handleEditToggle} className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> {t.edit}
                     </button>
                 ) : (
                     <div className="flex items-center gap-2">
                        <button onClick={handleEditToggle} className="text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">{t.cancel}</button>
                        <button onClick={handleSave} className="text-xs px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1"><Save className="w-3 h-3"/> {t.save}</button>
                     </div>
                 )}
             </div>
        </div>
      </div>

      {/* Weather Card (New) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
                <CloudSun className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t.weatherTitle}</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.temperature}</span>
                </div>
                {isEditing ? (
                    <input value={currentPlan.weather_info.temperature_range} onChange={e => handleWeatherChange('temperature_range', e.target.value)} className="w-full border-b border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                ) : (
                    <p className="font-medium text-slate-700">{currentPlan.weather_info.temperature_range}</p>
                )}
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <CloudSun className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.weatherCondition}</span>
                </div>
                 {isEditing ? (
                    <input value={currentPlan.weather_info.weather_condition} onChange={e => handleWeatherChange('weather_condition', e.target.value)} className="w-full border-b border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                ) : (
                    <p className="font-medium text-slate-700">{currentPlan.weather_info.weather_condition}</p>
                )}
            </div>

            <div>
                 <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Droplets className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.humidity}</span>
                </div>
                 {isEditing ? (
                    <input value={currentPlan.weather_info.humidity} onChange={e => handleWeatherChange('humidity', e.target.value)} className="w-full border-b border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                ) : (
                    <p className="font-medium text-slate-700">{currentPlan.weather_info.humidity}</p>
                )}
            </div>

            <div className="col-span-2 md:col-span-1">
                 <div className="flex items-center gap-2 mb-2 text-slate-400">
                    <Shirt className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{t.clothing}</span>
                </div>
                 {isEditing ? (
                    <textarea value={currentPlan.weather_info.clothing_advice} onChange={e => handleWeatherChange('clothing_advice', e.target.value)} className="w-full border border-slate-200 rounded p-1 text-sm focus:border-indigo-500 outline-none font-medium text-slate-700 min-h-[50px] resize-none" />
                ) : (
                    <p className="font-medium text-slate-700 text-sm leading-snug">{currentPlan.weather_info.clothing_advice}</p>
                )}
            </div>
        </div>
      </div>

      {/* Daily Timeline - Cohesive Card Design */}
      <div className="space-y-6">
        {currentPlan.daily_plan.map((day, index) => {
          const isOpen = expandedDay === 'ALL' || expandedDay === day.day;
          return (
            <div key={day.day} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 print:border-0 print:shadow-none print:break-inside-avoid ${isEditing ? 'ring-2 ring-indigo-50 border-indigo-100' : 'hover:shadow-md'}`}>
              
              {/* Day Header - Minimalist */}
              <button 
                onClick={() => toggleDay(day.day)}
                className="w-full text-left group no-print"
              >
                <div className={`px-6 py-5 flex items-start gap-4 transition-colors ${isOpen ? 'bg-white' : 'hover:bg-slate-50'}`}>
                    {/* Date Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold border transition-colors ${isOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}`}>
                        <span className="text-[10px] uppercase opacity-70">Day</span>
                        <span className="text-xl leading-none">{day.day}</span>
                    </div>
                    
                    {/* Header Text */}
                    <div className="flex-1 min-w-0 pt-0.5">
                         <div className="flex justify-between items-start">
                             <h3 className={`text-lg font-bold truncate pr-4 ${isOpen ? 'text-indigo-950' : 'text-slate-700'}`}>{day.city}</h3>
                             {isOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                         </div>
                         <p className="text-sm text-slate-500 font-medium truncate mt-0.5">{day.theme}</p>
                    </div>
                </div>
              </button>

              {/* Print Header */}
              <div className="hidden print:block p-6 border-b border-slate-100">
                 <h3 className="text-2xl font-bold text-slate-900">Day {day.day} - {day.city}</h3>
                 <p className="text-slate-500">{day.theme}</p>
              </div>

              {isOpen && (
                <div>
                    {/* Main Content Area */}
                    <div className="px-6 py-2">
                         {/* Timeline Container */}
                         <div className="mt-2 space-y-1">
                            {/* Morning */}
                            <TimelineSection 
                                title={t.morning} 
                                data={day.morning} 
                                icon={Sun} 
                                colorClass="text-amber-500" 
                                bgClass="bg-amber-50"
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
                                dayIndex={index} 
                                section="evening" 
                                isLast={true}
                            />
                         </div>
                    </div>

                    {/* Integrated Logistics Footer */}
                    <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-5 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-1 h-4 bg-slate-300 rounded-full"></span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.logistics}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Driving */}
                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 shadow-sm shrink-0">
                                    <Car className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.driving}</span>
                                    {isEditing ? (
                                        <input value={day.logistics.driving} onChange={e => handleNestedChange(index, 'logistics', 'driving', e.target.value)} className="bg-transparent border-b border-slate-300 w-full text-sm" />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700 leading-tight">{day.logistics.driving}</p>
                                    )}
                                </div>
                            </div>

                            {/* Dining */}
                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 shadow-sm shrink-0">
                                    <Utensils className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.dining}</span>
                                    {isEditing ? (
                                        <input value={day.logistics.dining} onChange={e => handleNestedChange(index, 'logistics', 'dining', e.target.value)} className="bg-transparent border-b border-slate-300 w-full text-sm" />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700 leading-tight">{day.logistics.dining}</p>
                                    )}
                                </div>
                            </div>

                            {/* Accommodation */}
                            <div className="flex gap-3 items-start">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 shadow-sm shrink-0">
                                    <BedDouble className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.stay}</span>
                                    {isEditing ? (
                                        <input value={day.logistics.accommodation} onChange={e => handleNestedChange(index, 'logistics', 'accommodation', e.target.value)} className="bg-transparent border-b border-slate-300 w-full text-sm" />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700 leading-tight">{day.logistics.accommodation}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sources */}
      {currentPlan.search_sources && currentPlan.search_sources.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6 no-print">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {t.sources}
            </h4>
            <ul className="space-y-2">
                {currentPlan.search_sources.map((source, index) => (
                    <li key={index} className="text-xs">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-indigo-600 hover:underline flex items-center gap-1 transition-colors truncate max-w-lg">
                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            {source.title}
                        </a>
                    </li>
                ))}
            </ul>
          </div>
      )}

      {/* Action Bar */}
      {!isEditing && (
        <div className="fixed bottom-6 right-6 z-10 flex flex-col items-end gap-3 no-print">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-full shadow-lg border border-slate-200">
                <button onClick={handlePrint} title={t.exportPDF} className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><Printer className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button onClick={handleExportText} title={t.exportText} className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><FileText className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button onClick={handleCopy} title={t.copy} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${copied ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t.copied : t.copyText}
                </button>
            </div>
        </div>
      )}

    </div>
  );
};
