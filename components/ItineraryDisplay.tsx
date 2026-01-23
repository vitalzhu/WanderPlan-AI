
import React, { useState, useEffect } from 'react';
import { TravelPlan, Language, TimeBlock, LogisticsBlock } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Copy, Check, Bus, BedDouble, Info, FileText, Printer, Thermometer, Shirt, ExternalLink, Edit2, Save, X, ArrowLeft, CloudSun, Droplets, Target, Lightbulb, Ticket, Backpack, Moon, Sun, Utensils, Car, Star } from 'lucide-react';

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

  // Render a Time Block (Morning/Afternoon/Evening)
  const RenderTimeBlock = ({ 
      title, 
      data, 
      icon: Icon, 
      themeColor, 
      dayIndex, 
      section 
  }: { 
      title: string, 
      data: TimeBlock, 
      icon: any, 
      themeColor: string, 
      dayIndex: number, 
      section: 'morning' | 'afternoon' | 'evening' 
  }) => {
      // Determine colors based on themeColor prop
      const bgClass = themeColor === 'amber' ? 'bg-amber-50 border-amber-100' : themeColor === 'sky' ? 'bg-sky-50 border-sky-100' : 'bg-indigo-50 border-indigo-100';
      const textClass = themeColor === 'amber' ? 'text-amber-700' : themeColor === 'sky' ? 'text-sky-700' : 'text-indigo-700';
      const iconBgClass = themeColor === 'amber' ? 'bg-amber-100' : themeColor === 'sky' ? 'bg-sky-100' : 'bg-indigo-100';

      return (
          <div className={`p-4 rounded-xl border ${bgClass} relative`}>
              <div className="flex items-start gap-3 mb-2">
                  <div className={`p-1.5 rounded-lg shrink-0 ${iconBgClass} ${textClass}`}>
                      <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${textClass}`}>{title}</div>
                      {isEditing ? (
                          <input 
                            value={data.title}
                            onChange={(e) => handleNestedChange(dayIndex, section, 'title', e.target.value)}
                            className="w-full text-base font-bold bg-white/50 border border-black/10 rounded px-2 py-1 mb-2"
                          />
                      ) : (
                          <h4 className="text-base font-bold text-slate-900">{data.title}</h4>
                      )}
                  </div>
              </div>
              
              <div className="pl-10">
                  {isEditing ? (
                      <textarea 
                        value={data.content}
                        onChange={(e) => handleNestedChange(dayIndex, section, 'content', e.target.value)}
                        className="w-full text-sm text-slate-700 leading-relaxed bg-white/50 border border-black/10 rounded p-2 min-h-[80px]"
                      />
                  ) : (
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.content}</p>
                  )}

                  {/* Tips Section */}
                  {(data.tips || isEditing) && (
                      <div className="mt-3 bg-white/60 rounded-lg p-3 border border-black/5 flex gap-2">
                          <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${textClass}`} />
                          <div className="flex-1">
                              <span className={`text-xs font-bold block mb-1 ${textClass}`}>{t.warmTips}:</span>
                              {isEditing ? (
                                  <textarea 
                                    value={data.tips}
                                    onChange={(e) => handleNestedChange(dayIndex, section, 'tips', e.target.value)}
                                    className="w-full text-xs bg-transparent border-b border-black/10 outline-none"
                                    placeholder="Add tips here..."
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
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden no-print">
        <div className="bg-indigo-600 p-6 text-white">
            <div className="flex justify-between items-center mb-6">
                 <button onClick={onBack} className="flex items-center gap-1.5 text-xs bg-indigo-700/50 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/50">
                    <ArrowLeft className="w-3.5 h-3.5" />{t.backToSearch}
                 </button>
                 <button onClick={onReset} className="text-xs bg-white/10 hover:bg-white/20 text-indigo-50 px-3 py-1.5 rounded-full transition-colors">
                    {t.newTrip}
                 </button>
            </div>
            <h1 className="text-2xl font-bold mb-2">{currentPlan.overview.trip_theme}</h1>
            <div className="flex flex-wrap gap-3 text-indigo-100 text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentPlan.overview.cities.join(' - ')}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {currentPlan.overview.total_days} {t.daysUnit}</span>
            </div>
        </div>
        
        <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-end">
             <div className="flex items-center gap-2">
                 {!isEditing ? (
                     <button onClick={handleEditToggle} className="flex items-center gap-1.5 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        <Edit2 className="w-4 h-4" /> {t.edit}
                     </button>
                 ) : (
                     <div className="flex items-center gap-2">
                        <button onClick={handleEditToggle} className="flex items-center gap-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"><X className="w-4 h-4" /> {t.cancel}</button>
                        <button onClick={handleSave} className="flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"><Save className="w-4 h-4" /> {t.save}</button>
                     </div>
                 )}
             </div>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="space-y-6">
        {currentPlan.daily_plan.map((day, index) => {
          const isOpen = expandedDay === 'ALL' || expandedDay === day.day;
          return (
            <div key={day.day} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all print:border-0 print:shadow-none print:break-inside-avoid ${isEditing ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}>
              
              {/* Header */}
              <button 
                onClick={() => toggleDay(day.day)}
                className="w-full p-0 transition-colors text-left no-print block"
              >
                <div className={`p-5 flex items-center justify-between border-b ${isOpen ? 'border-slate-100 bg-slate-50' : 'border-transparent bg-white hover:bg-slate-50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border shadow-sm ${isOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
                             <span className="text-[10px] font-bold uppercase opacity-80">Day</span>
                             <span className="text-2xl font-extrabold leading-none">{day.day}</span>
                        </div>
                        <div>
                            <div className="font-bold text-lg text-slate-900">{day.city}</div>
                            <div className="text-sm text-slate-500 font-medium">{day.theme}</div>
                        </div>
                    </div>
                    {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </button>

              {/* Print Header */}
              <div className="hidden print:block p-5 border-b border-slate-200">
                 <h3 className="text-xl font-bold text-slate-900">Day {day.day} | {day.theme}</h3>
              </div>

              {isOpen && (
                <div className="p-5 pt-5 space-y-6">
                    {/* Morning (Amber) */}
                    <RenderTimeBlock 
                        title={t.morning} 
                        data={day.morning} 
                        icon={Sun} 
                        themeColor="amber" 
                        dayIndex={index} 
                        section="morning" 
                    />

                    {/* Afternoon (Sky) */}
                    <RenderTimeBlock 
                        title={t.afternoon} 
                        data={day.afternoon} 
                        icon={CloudSun} 
                        themeColor="sky" 
                        dayIndex={index} 
                        section="afternoon" 
                    />

                    {/* Evening (Indigo) */}
                    <RenderTimeBlock 
                        title={t.evening} 
                        data={day.evening} 
                        icon={Moon} 
                        themeColor="indigo" 
                        dayIndex={index} 
                        section="evening" 
                    />

                    {/* Logistics Footer */}
                    <div className="bg-slate-800 rounded-xl p-4 text-slate-300 text-sm mt-4 shadow-lg">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" /> {t.logistics}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-2">
                                <Car className="w-4 h-4 mt-0.5 text-slate-400" />
                                <div>
                                    <span className="block font-bold text-white text-xs mb-0.5">{t.driving}</span>
                                    {isEditing ? (
                                        <input value={day.logistics.driving} onChange={e => handleNestedChange(index, 'logistics', 'driving', e.target.value)} className="bg-transparent border-b border-slate-600 w-full text-xs" />
                                    ) : (
                                        <span>{day.logistics.driving}</span>
                                    )}
                                </div>
                            </div>
                             <div className="flex items-start gap-2">
                                <Utensils className="w-4 h-4 mt-0.5 text-slate-400" />
                                <div>
                                    <span className="block font-bold text-white text-xs mb-0.5">{t.dining}</span>
                                    {isEditing ? (
                                        <input value={day.logistics.dining} onChange={e => handleNestedChange(index, 'logistics', 'dining', e.target.value)} className="bg-transparent border-b border-slate-600 w-full text-xs" />
                                    ) : (
                                        <span>{day.logistics.dining}</span>
                                    )}
                                </div>
                            </div>
                             <div className="flex items-start gap-2">
                                <BedDouble className="w-4 h-4 mt-0.5 text-slate-400" />
                                <div>
                                    <span className="block font-bold text-white text-xs mb-0.5">{t.stay}</span>
                                    {isEditing ? (
                                        <input value={day.logistics.accommodation} onChange={e => handleNestedChange(index, 'logistics', 'accommodation', e.target.value)} className="bg-transparent border-b border-slate-600 w-full text-xs" />
                                    ) : (
                                        <span>{day.logistics.accommodation}</span>
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
