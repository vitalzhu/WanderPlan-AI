import React, { useState, useEffect } from 'react';
import { TravelPreferences, Language, AIProvider } from '../types';
import { TRAVEL_STYLES, PACE_OPTIONS, COMPANION_OPTIONS, BUDGET_OPTIONS, TRANSPORT_OPTIONS, AVOID_OPTIONS } from '../constants';
import { TRANSLATIONS } from '../translations';
import { MapPin, Calendar, Sparkles, AlertCircle, Clock, Plus, Trash2, Ban, Cpu, Search } from 'lucide-react';

interface TravelFormProps {
  onSubmit: (prefs: TravelPreferences) => void;
  isLoading: boolean;
  language: Language;
  initialValues?: TravelPreferences | null;
}

export const TravelForm: React.FC<TravelFormProps> = ({ onSubmit, isLoading, language, initialValues }) => {
  const [destination, setDestination] = useState(initialValues?.destination || '');
  const [waypoints, setWaypoints] = useState<string[]>(initialValues?.waypoints || []);
  const [startDate, setStartDate] = useState(initialValues?.startDate || '');
  const [endDate, setEndDate] = useState(initialValues?.endDate || '');
  const [travelers, setTravelers] = useState<number>(initialValues?.travelers || 2);
  const [styles, setStyles] = useState<string[]>(initialValues?.styles || []);
  const [provider, setProvider] = useState<AIProvider>(initialValues?.provider || 'gemini');
  
  const [avoid, setAvoid] = useState<string[]>(() => {
    const knownIds = new Set(AVOID_OPTIONS.map(o => o.id));
    return initialValues?.avoid?.filter(a => knownIds.has(a)) || [];
  });
  const [customAvoid, setCustomAvoid] = useState(() => {
    const knownIds = new Set(AVOID_OPTIONS.map(o => o.id));
    return initialValues?.avoid?.filter(a => !knownIds.has(a)).join(', ') || '';
  });

  const [pace, setPace] = useState(initialValues?.pace || 'Balanced');
  const [transportation, setTransportation] = useState(initialValues?.transportation || 'Public Transit');
  const [companions, setCompanions] = useState(initialValues?.companions || 'Couple');
  const [budget, setBudget] = useState(initialValues?.budget || 'Mid-range');
  const [customKeywords, setCustomKeywords] = useState(initialValues?.customKeywords || '');
  const [error, setError] = useState('');

  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (initialValues) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 2);
    setEndDate(afterTomorrow.toISOString().split('T')[0]);
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) { setError(t.errorDest); return; }
    if (styles.length === 0) { setError(t.errorStyle); return; }
    
    const finalAvoid = [...avoid];
    if (customAvoid.trim()) {
       const customs = customAvoid.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
       finalAvoid.push(...customs);
    }

    setError('');
    onSubmit({
      destination,
      waypoints: waypoints.filter(w => w.trim() !== ''),
      days: Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1,
      travelers,
      startDate,
      endDate,
      styles,
      avoid: finalAvoid,
      pace,
      transportation,
      companions,
      budget,
      customKeywords,
      provider
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8 p-1">
      {/* Provider Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-500" />
          {t.aiModel}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setProvider('gemini')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              provider === 'gemini' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-bold">{t.geminiLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setProvider('deepseek')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
              provider === 'deepseek' ? 'bg-slate-50 border-slate-800 ring-2 ring-slate-200' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold">{t.deepseekLabel}</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-500" />
          {t.whereWhen}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.destination}</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder={t.destinationPlaceholder} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.startDate}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.endDateLabel}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {t.vibe}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TRAVEL_STYLES.map(style => (
            <button key={style.id} type="button" onClick={() => setStyles(prev => prev.includes(style.id) ? prev.filter(s => s !== style.id) : [...prev, style.id])} className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${styles.includes(style.id) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'bg-white border-slate-200'}`}>
              <style.icon className="w-4 h-4" />
              <span className="text-sm">{style.label[language]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" />
          {t.avoidLabel}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {AVOID_OPTIONS.map(opt => (
            <button key={opt.id} type="button" onClick={() => setAvoid(prev => prev.includes(opt.id) ? prev.filter(s => s !== opt.id) : [...prev, opt.id])} className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${avoid.includes(opt.id) ? 'bg-red-50 border-red-500 text-red-700 font-medium' : 'bg-white border-slate-200'}`}>
              <opt.icon className="w-4 h-4" />
              <span className="text-sm">{opt.label[language]}</span>
            </button>
          ))}
        </div>
        <input type="text" value={customAvoid} onChange={e => setCustomAvoid(e.target.value)} placeholder={t.customAvoidPlaceholder} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none text-sm" />
      </div>

      {error && <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200"><AlertCircle className="w-5 h-5" /> <span className="text-sm font-medium">{error}</span></div>}

      <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
        {isLoading ? t.planning : t.generateBtn}
      </button>
    </form>
  );
};