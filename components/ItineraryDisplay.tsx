
import React, { useState, useEffect } from 'react';
import { TravelPlan, Language, DayPlan, ActivityBlock } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Copy, Check, Bus, BedDouble, Info, FileText, Printer, Thermometer, Shirt, ExternalLink, Edit2, Save, X, ArrowLeft, CloudSun, Droplets, Target, Lightbulb, Ticket, Backpack } from 'lucide-react';

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

  // Update local state if prop changes (e.g. re-generation)
  useEffect(() => {
    setPlan(initialPlan);
    setEditedPlan(initialPlan);
  }, [initialPlan]);

  const toggleDay = (day: number) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  const handleEditToggle = () => {
    if (isEditing) {
        setEditedPlan(plan); // Revert
        setIsEditing(false);
    } else {
        setEditedPlan(JSON.parse(JSON.stringify(plan))); // Deep copy
        setExpandedDay('ALL'); // Expand all for easier editing
        setIsEditing(true);
    }
  };

  const handleSave = () => {
    setPlan(editedPlan);
    setIsEditing(false);
    setExpandedDay(1); // Collapse back to view mode
  };

  const handleDayFieldChange = (index: number, field: keyof DayPlan, value: string) => {
      const newDailyPlan = [...editedPlan.daily_plan];
      newDailyPlan[index] = { ...newDailyPlan[index], [field]: value };
      setEditedPlan({ ...editedPlan, daily_plan: newDailyPlan });
  };

  const handleActivityChange = (dayIndex: number, period: 'morning' | 'afternoon' | 'evening', field: keyof ActivityBlock, value: string) => {
    const newDailyPlan = [...editedPlan.daily_plan];
    newDailyPlan[dayIndex] = {
        ...newDailyPlan[dayIndex],
        [period]: {
            ...newDailyPlan[dayIndex][period],
            [field]: value
        }
    };
    setEditedPlan({ ...editedPlan, daily_plan: newDailyPlan });
  };

  // Helper to generate text content from the CURRENT viewable plan
  const generateTextContent = () => {
    let content = `WanderPlan AI - ${plan.overview.trip_theme}\n`;
    content += `==========================================\n`;
    content += `${t.destination}: ${plan.overview.cities.join(' - ')}\n`;
    content += `${t.duration}: ${plan.overview.total_days} ${t.daysUnit}\n`;
    content += `${t.pace}: ${plan.overview.pace}\n\n`;

    content += `[${t.bestFor}]\n${plan.overview.best_for.join(', ')}\n\n`;

    content += `[${t.weatherTitle}]\n`;
    content += `${t.temperature}: ${plan.weather_info.temperature_range}\n`;
    content += `${t.weatherCondition}: ${plan.weather_info.weather_condition}\n`;
    content += `${t.humidity}: ${plan.weather_info.humidity}\n`;
    content += `${t.clothing}: ${plan.weather_info.clothing_advice}\n\n`;
    
    content += `==========================================\n`;
    content += `DAILY ITINERARY\n`;
    content += `==========================================\n\n`;

    plan.daily_plan.forEach(day => {
        content += `Day ${day.day}: ${day.city}\n`;
        content += `${t.dailyTheme}: ${day.theme}\n`;
        content += `------------------------------------------\n`;
        
        ['morning', 'afternoon', 'evening'].forEach((period) => {
            const p = period as 'morning' | 'afternoon' | 'evening';
            const block = day[p];
            content += `${t[period]}: ${block.time} - ${block.activity}\n`;
            content += `${block.description}\n`;
            if(block.why_this_place) content += `> ${t.whyHere}: ${block.why_this_place}\n`;
            if(block.reservation) content += `> ${t.reservation}: ${block.reservation}\n`;
            if(block.items_to_bring) content += `> ${t.bring}: ${block.items_to_bring}\n`;
            content += `\n`;
        });
        
        content += `* ${t.notes}: ${day.notes}\n`;
        content += `* ${t.planB}: ${day.plan_b}\n\n`;
    });

    content += `==========================================\n`;
    content += `LOGISTICS\n`;
    content += `==========================================\n\n`;
    content += `${t.accommodation}:\n${plan.accommodation_tips}\n\n`;
    content += `${t.transport}:\n${plan.transport_tips}\n\n`;
    
    if (plan.must_book_in_advance.length > 0) {
        content += `${t.bookAhead}:\n`;
        plan.must_book_in_advance.forEach(item => content += `- ${item}\n`);
    }

    if (plan.search_sources && plan.search_sources.length > 0) {
        content += `\n[${t.sources}]\n`;
        plan.search_sources.forEach(src => content += `- ${src.title}: ${src.url}\n`);
    }

    content += `\n\nGenerated by WanderPlan AI`;
    return content;
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
    link.download = `WanderPlan_${plan.overview.cities[0] || 'Trip'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const prev = expandedDay;
    setExpandedDay('ALL');
    // Wait for state update and re-render
    setTimeout(() => {
        window.print();
        setExpandedDay(prev);
    }, 500);
  };

  // Helper Component for Activity Section
  const ActivitySection = ({ 
    title, 
    data, 
    colorClass, 
    dayIndex, 
    period 
  }: { 
    title: string, 
    data: ActivityBlock, 
    colorClass: string,
    dayIndex: number,
    period: 'morning' | 'afternoon' | 'evening'
  }) => {
    return (
        <div className="relative print:break-inside-avoid mb-6 last:mb-0">
            {/* Timeline Dot */}
            <span className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ring-4 ring-white print:hidden ${colorClass}`}></span>
            
            <div className="flex justify-between items-baseline mb-1">
                <h4 className={`text-sm font-bold uppercase ${colorClass.replace('bg-', 'text-')}`}>{title}</h4>
                {!isEditing && <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{data.time}</span>}
            </div>

            {isEditing ? (
                <div className="space-y-2">
                     <div className="flex gap-2">
                        <input 
                           type="text" 
                           value={data.time} 
                           onChange={(e) => handleActivityChange(dayIndex, period, 'time', e.target.value)}
                           className="w-1/3 p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                           placeholder={t.time}
                        />
                        <input 
                           type="text" 
                           value={data.activity} 
                           onChange={(e) => handleActivityChange(dayIndex, period, 'activity', e.target.value)}
                           className="w-2/3 p-2 text-sm font-bold border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                           placeholder={t.activity}
                        />
                     </div>
                     <textarea
                        value={data.description}
                        onChange={(e) => handleActivityChange(dayIndex, period, 'description', e.target.value)}
                        className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none min-h-[60px]"
                        placeholder="Description..."
                     />
                     <div className="grid grid-cols-1 gap-2">
                         <input type="text" value={data.why_this_place} onChange={(e) => handleActivityChange(dayIndex, period, 'why_this_place', e.target.value)} className="text-xs border p-1 rounded" placeholder={t.whyHere} />
                         <input type="text" value={data.reservation} onChange={(e) => handleActivityChange(dayIndex, period, 'reservation', e.target.value)} className="text-xs border p-1 rounded" placeholder={t.reservation} />
                         <input type="text" value={data.items_to_bring} onChange={(e) => handleActivityChange(dayIndex, period, 'items_to_bring', e.target.value)} className="text-xs border p-1 rounded" placeholder={t.bring} />
                     </div>
                </div>
            ) : (
                <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                    <div className="font-bold text-slate-800 mb-1">{data.activity}</div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">{data.description}</p>
                    
                    {/* Meta Tags Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {data.why_this_place && (
                            <div className="flex items-start gap-1.5 text-indigo-700 bg-indigo-50 p-2 rounded">
                                <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span><span className="font-semibold">{t.whyHere}:</span> {data.why_this_place}</span>
                            </div>
                        )}
                        {data.reservation && (
                            <div className="flex items-start gap-1.5 text-amber-700 bg-amber-50 p-2 rounded">
                                <Ticket className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span><span className="font-semibold">{t.reservation}:</span> {data.reservation}</span>
                            </div>
                        )}
                        {data.items_to_bring && (
                             <div className="flex items-start gap-1.5 text-emerald-700 bg-emerald-50 p-2 rounded sm:col-span-2">
                                <Backpack className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span><span className="font-semibold">{t.bring}:</span> {data.items_to_bring}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
  };

  const currentPlan = isEditing ? editedPlan : plan;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="bg-indigo-600 p-6 text-white">
            <div className="flex justify-between items-center mb-6">
                 <button 
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-xs bg-indigo-700/50 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/50"
                 >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t.backToSearch}
                 </button>
                 <button 
                    onClick={onReset}
                    className="text-xs bg-white/10 hover:bg-white/20 text-indigo-50 px-3 py-1.5 rounded-full transition-colors"
                >
                    {t.newTrip}
                </button>
            </div>
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold mb-2">{currentPlan.overview.trip_theme}</h1>
                    <div className="flex flex-wrap gap-3 text-indigo-100 text-sm">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentPlan.overview.cities.join(' - ')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {currentPlan.overview.total_days} {t.daysUnit}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {currentPlan.overview.pace}</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Highlights */}
        <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center flex-wrap gap-4">
             <div>
                 <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">{t.bestFor}</div>
                 <div className="flex flex-wrap gap-2">
                    {currentPlan.overview.best_for.map((tag, idx) => (
                        <span key={idx} className="bg-white text-indigo-700 px-3 py-1 rounded-full text-xs font-medium border border-indigo-100 shadow-sm">
                            {tag}
                        </span>
                    ))}
                 </div>
             </div>
             
             {/* Edit Controls */}
             <div className="flex items-center gap-2">
                 {!isEditing ? (
                     <button 
                        onClick={handleEditToggle}
                        className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                     >
                        <Edit2 className="w-4 h-4" /> {t.edit}
                     </button>
                 ) : (
                     <div className="flex items-center gap-2">
                        <button 
                            onClick={handleEditToggle} // Cancels
                            className="flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X className="w-4 h-4" /> {t.cancel}
                        </button>
                        <button 
                            onClick={handleSave}
                            className="flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" /> {t.save}
                        </button>
                     </div>
                 )}
             </div>
        </div>
        {isEditing && (
            <div className="bg-amber-50 px-6 py-3 text-xs text-amber-800 border-b border-amber-100 flex items-center gap-2">
                <Info className="w-4 h-4" /> {t.editingDesc}
            </div>
        )}
      </div>

      {/* Weather & Clothing Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border print:break-inside-avoid">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-orange-500" /> {t.weatherTitle}
        </h3>
        <div className="flex flex-col gap-4">
             {/* Weather Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1 text-orange-700">
                         <Thermometer className="w-3.5 h-3.5" />
                         <div className="text-xs font-bold uppercase">{t.temperature}</div>
                    </div>
                    <div className="font-semibold text-slate-800">{currentPlan.weather_info.temperature_range}</div>
                </div>
                <div className="bg-sky-50 p-3 rounded-lg border border-sky-100 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1 text-sky-700">
                        <CloudSun className="w-3.5 h-3.5" />
                        <div className="text-xs font-bold uppercase">{t.weatherCondition}</div>
                    </div>
                    <div className="font-semibold text-slate-800">{currentPlan.weather_info.weather_condition}</div>
                </div>
                 <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1 text-teal-700">
                         <Droplets className="w-3.5 h-3.5" />
                         <div className="text-xs font-bold uppercase">{t.humidity}</div>
                    </div>
                    <div className="font-semibold text-slate-800">{currentPlan.weather_info.humidity}</div>
                </div>
            </div>

            {/* Clothing Advice */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                    <Shirt className="w-4 h-4 text-blue-600" />
                    <div className="text-xs font-bold text-blue-700 uppercase">{t.clothing}</div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                    {currentPlan.weather_info.clothing_advice}
                </p>
            </div>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{currentPlan.overview.trip_theme}</h1>
        <div className="flex gap-4 text-slate-600 text-sm">
            <span>{currentPlan.overview.cities.join(' - ')}</span>
            <span>•</span>
            <span>{currentPlan.overview.total_days} {t.daysUnit}</span>
            <span>•</span>
            <span>{currentPlan.overview.pace}</span>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="space-y-4">
        {currentPlan.daily_plan.map((day, index) => {
          const isOpen = expandedDay === 'ALL' || expandedDay === day.day;
          return (
            <div key={day.day} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all print:border-0 print:shadow-none print:mb-6 print:break-inside-avoid ${isEditing ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}>
              <button 
                onClick={() => toggleDay(day.day)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left no-print"
              >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shadow-sm ${isOpen ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                        <span className="text-xs uppercase opacity-80">Day</span>
                        <span className="text-xl leading-none">{day.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            {isEditing ? (
                                <input 
                                    type="text"
                                    value={day.city}
                                    onChange={(e) => handleDayFieldChange(index, 'city', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-white border border-slate-300 rounded px-2 py-0.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            ) : (
                                <h3 className="text-base font-bold text-slate-800 truncate">{day.city}</h3>
                            )}
                        </div>
                        {isEditing ? (
                            <input 
                                type="text"
                                value={day.theme}
                                onChange={(e) => handleDayFieldChange(index, 'theme', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs w-full focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder={t.dailyTheme}
                            />
                        ) : (
                            day.theme && (
                                <div className="flex items-center gap-1.5 text-sm text-indigo-600">
                                    <Target className="w-3.5 h-3.5" />
                                    <span className="font-medium truncate">{day.theme}</span>
                                </div>
                            )
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
              </button>

              {/* Print version of day header */}
              <div className="hidden print:flex items-center gap-3 mb-3 border-b border-slate-200 pb-2">
                 <div className="font-bold text-xl text-indigo-900">Day {day.day}</div>
                 <div className="text-slate-500 font-medium">{day.city} - {day.theme}</div>
              </div>

              {isOpen && (
                <div className="px-5 pb-6 pt-0 border-t border-slate-100 print:border-0 print:p-0">
                    <div className="mt-4 relative pl-4 border-l-2 border-indigo-100 space-y-2 print:border-l-4 print:pl-6">
                        <ActivitySection title={t.morning} data={day.morning} colorClass="bg-amber-400" dayIndex={index} period="morning" />
                        <ActivitySection title={t.afternoon} data={day.afternoon} colorClass="bg-orange-400" dayIndex={index} period="afternoon" />
                        <ActivitySection title={t.evening} data={day.evening} colorClass="bg-indigo-500" dayIndex={index} period="evening" />
                    </div>

                    {/* Footer Cards: Notes & Plan B */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-2 print:mt-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-white print:border print:border-slate-200 print:break-inside-avoid">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                                <Info className="w-3.5 h-3.5" /> {t.notes}
                            </h4>
                            {isEditing ? (
                                <textarea
                                    value={day.notes}
                                    onChange={(e) => handleDayFieldChange(index, 'notes', e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600 min-h-[60px]"
                                />
                            ) : (
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{day.notes}</p>
                            )}
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border print:border-blue-100 print:break-inside-avoid">
                            <h4 className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1.5 mb-2">
                                <AlertCircle className="w-3.5 h-3.5" /> {t.planB}
                            </h4>
                            {isEditing ? (
                                <textarea
                                    value={day.plan_b}
                                    onChange={(e) => handleDayFieldChange(index, 'plan_b', e.target.value)}
                                    className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm text-blue-800 min-h-[60px]"
                                />
                            ) : (
                                <p className="text-sm text-blue-800 whitespace-pre-wrap">{day.plan_b}</p>
                            )}
                        </div>
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border print:break-inside-avoid">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-indigo-500" /> {t.accommodation}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{currentPlan.accommodation_tips}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border print:break-inside-avoid">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Bus className="w-5 h-5 text-indigo-500" /> {t.transport}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{currentPlan.transport_tips}</p>
        </div>
      </div>

      {/* Important Bookings */}
      {currentPlan.must_book_in_advance.length > 0 && (
         <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm print:bg-white print:border print:border-amber-200 print:break-inside-avoid">
            <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5" /> {t.bookAhead}
            </h3>
            <ul className="space-y-2">
                {currentPlan.must_book_in_advance.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-amber-600 rounded-full flex-shrink-0"></span>
                        {item}
                    </li>
                ))}
            </ul>
         </div>
      )}

      {/* Sources */}
      {currentPlan.search_sources && currentPlan.search_sources.length > 0 && (
          <div className="mt-8 border-t border-slate-200 pt-6 no-print">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> {t.sources}
            </h4>
            <ul className="space-y-2">
                {currentPlan.search_sources.map((source, index) => (
                    <li key={index} className="text-xs">
                        <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-500 hover:text-indigo-600 hover:underline flex items-center gap-1 transition-colors truncate max-w-lg"
                        >
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
                <button 
                    onClick={handlePrint}
                    title={t.exportPDF}
                    className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <Printer className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button 
                    onClick={handleExportText}
                    title={t.exportText}
                    className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                    <FileText className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
                <button 
                    onClick={handleCopy}
                    title={t.copy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                        copied 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t.copied : t.copyText}
                </button>
            </div>
        </div>
      )}

    </div>
  );
};
