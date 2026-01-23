
import React, { useState, useEffect } from 'react';
import { TravelPlan, Language, DayPlan, MorningBlock, AfternoonBlock, EveningBlock, PracticalInfo } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp, AlertCircle, Copy, Check, Bus, BedDouble, Info, FileText, Printer, Thermometer, Shirt, ExternalLink, Edit2, Save, X, ArrowLeft, CloudSun, Droplets, Target, Lightbulb, Ticket, Backpack, Moon, Sunset, Sun, Star, Navigation } from 'lucide-react';

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
  const handleNestedChange = (dayIndex: number, section: 'morning' | 'afternoon' | 'evening' | 'practical_info', field: string, value: string) => {
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
      // Simplified text generation for clipboard
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

  // Helper component for label-value pairs
  const InfoRow = ({ label, value, isEd, onChange, multiline = false }: { label: string, value: string, isEd: boolean, onChange?: (v: string) => void, multiline?: boolean }) => {
    if (isEd && onChange) {
        return (
            <div className="mb-2">
                <span className="text-xs font-bold text-slate-500 block mb-1">{label}</span>
                {multiline ? (
                    <textarea 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                ) : (
                    <input 
                        type="text" 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                )}
            </div>
        );
    }
    if (!value) return null;
    return (
        <li className="flex flex-col sm:flex-row sm:gap-2 items-start text-sm text-slate-700 mb-2 leading-relaxed">
            <span className="font-bold shrink-0 text-slate-900 min-w-[5rem]">• {label}：</span>
            <span>{value}</span>
        </li>
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

      {/* Daily Timeline - THE NEW STRUCTURE */}
      <div className="space-y-6">
        {currentPlan.daily_plan.map((day, index) => {
          const isOpen = expandedDay === 'ALL' || expandedDay === day.day;
          return (
            <div key={day.day} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all print:border-0 print:shadow-none print:break-inside-avoid ${isEditing ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}>
              
              {/* Header */}
              <button 
                onClick={() => toggleDay(day.day)}
                className="w-full p-5 hover:bg-slate-50 transition-colors text-left no-print border-b border-slate-100"
              >
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
                            <span className="bg-indigo-100 px-2 py-0.5 rounded text-sm">Day {day.day}</span>
                            <span>{day.theme}</span>
                        </div>
                        <div className="text-slate-500 text-sm mt-1 italic pl-1">
                            {day.summary}
                        </div>
                    </div>
                    {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </button>

              {/* Print Header */}
              <div className="hidden print:block p-5 border-b border-slate-200">
                 <h3 className="text-xl font-bold text-slate-900">Day {day.day} | {day.theme}</h3>
                 <p className="text-slate-600 italic mt-1">{day.summary}</p>
              </div>

              {isOpen && (
                <div className="p-6 pt-2 space-y-6">
                    
                    {/* Morning Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="font-bold text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-full inline-flex items-center gap-2 border border-slate-200">
                                🕘 {t.morning} ｜ {day.morning.subtitle}
                            </h4>
                        </div>
                        <hr className="border-t border-slate-200 my-4 border-dashed" />
                        <ul className="pl-2">
                            <InfoRow label={t.overview} value={day.morning.overview} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'morning', 'overview', v)} multiline />
                            <InfoRow label={t.coreExperience} value={day.morning.core_experience} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'morning', 'core_experience', v)} />
                            <InfoRow label={t.highlights} value={day.morning.highlights} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'morning', 'highlights', v)} multiline />
                            <InfoRow label={t.photoTips} value={day.morning.photo_tips} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'morning', 'photo_tips', v)} />
                            <InfoRow label={t.seasonTips} value={day.morning.season_tips} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'morning', 'season_tips', v)} />
                        </ul>
                    </div>

                    {/* Afternoon Section */}
                    <div>
                         <div className="flex items-center gap-2 mb-4 mt-8">
                            <h4 className="font-bold text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-full inline-flex items-center gap-2 border border-slate-200">
                                🕐 {t.afternoon} ｜ {day.afternoon.subtitle}
                            </h4>
                        </div>
                        <hr className="border-t border-slate-200 my-4 border-dashed" />
                        <ul className="pl-2">
                            <InfoRow label={t.spotName} value={day.afternoon.spot_name} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'afternoon', 'spot_name', v)} />
                            <InfoRow label={t.landscapeFeatures} value={day.afternoon.landscape_features} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'afternoon', 'landscape_features', v)} />
                            <InfoRow label={t.playStyle} value={day.afternoon.play_style} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'afternoon', 'play_style', v)} />
                            <InfoRow label={t.riskTips} value={day.afternoon.risk_tips} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'afternoon', 'risk_tips', v)} />
                        </ul>
                    </div>

                    {/* Evening Section */}
                    <div>
                         <div className="flex items-center gap-2 mb-4 mt-8">
                            <h4 className="font-bold text-base text-slate-900 bg-slate-100 px-3 py-1 rounded-full inline-flex items-center gap-2 border border-slate-200">
                                🌙 {t.evening} ｜ {day.evening.subtitle}
                            </h4>
                        </div>
                        <hr className="border-t border-slate-200 my-4 border-dashed" />
                        <ul className="pl-2">
                            <InfoRow label={t.schedule} value={day.evening.schedule} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'evening', 'schedule', v)} multiline />
                            <InfoRow label={t.stayFeatures} value={day.evening.accommodation_features} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'evening', 'accommodation_features', v)} />
                            <InfoRow label={t.nightTips} value={day.evening.night_suggestions} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'evening', 'night_suggestions', v)} />
                        </ul>
                    </div>

                    {/* Practical Info Section */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                📌 {t.practicalInfo}
                            </h4>
                        </div>
                        <hr className="border-t border-slate-200 my-4 border-dashed" />
                        <ul className="pl-2 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                            <InfoRow label={t.drivingTime} value={day.practical_info.driving_time} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'practical_info', 'driving_time', v)} />
                            <InfoRow label={t.dining} value={day.practical_info.dining} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'practical_info', 'dining', v)} />
                            <InfoRow label={t.stayInfo} value={day.practical_info.accommodation} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'practical_info', 'accommodation', v)} />
                            <InfoRow label={t.physicalRating} value={day.practical_info.physical_rating} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'practical_info', 'physical_rating', v)} />
                            <div className="md:col-span-2">
                                <InfoRow label={t.gearAdvice} value={day.practical_info.clothing_gear} isEd={isEditing} onChange={(v) => handleNestedChange(index, 'practical_info', 'clothing_gear', v)} />
                            </div>
                        </ul>
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
