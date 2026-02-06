
import React, { useState, useEffect } from 'react';
import { TravelPreferences, Language } from '../types';
import { TRAVEL_STYLES, PACE_OPTIONS, COMPANION_OPTIONS, BUDGET_OPTIONS, TRANSPORT_OPTIONS, AVOID_OPTIONS } from '../constants';
import { TRANSLATIONS } from '../translations';
import { MapPin, Sparkles, AlertCircle, Plus, Trash2, Ban } from 'lucide-react';

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

  // Set default dates
  useEffect(() => {
    if (initialValues) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 2);
    setEndDate(afterTomorrow.toISOString().split('T')[0]);
  }, [initialValues]);

  // Sync end date
  useEffect(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setEndDate(startDate);
    }
  }, [startDate, endDate]);

  const calculateDays = (start: string, end: string): number => {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const addWaypoint = () => setWaypoints([...waypoints, '']);
  const removeWaypoint = (i: number) => setWaypoints(waypoints.filter((_, idx) => idx !== i));
  const updateWaypoint = (i: number, v: string) => {
    const newWp = [...waypoints];
    newWp[i] = v;
    setWaypoints(newWp);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) { setError(t.errorDest); return; }
    if (styles.length === 0) { setError(t.errorStyle); return; }
    
    const days = calculateDays(startDate, endDate);
    if (days < 1 || days > 14) { setError(t.errorDays); return; }

    const finalAvoid = [...avoid];
    if (customAvoid.trim()) {
       const customs = customAvoid.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
       finalAvoid.push(...customs);
    }

    setError('');
    onSubmit({
      destination,
      waypoints: waypoints.filter(w => w.trim() !== ''),
      days,
      travelers,
      startDate,
      endDate,
      styles,
      avoid: finalAvoid,
      pace,
      transportation,
      companions,
      budget,
      customKeywords
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8 p-1">
      
      {/* Destination */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-500" />
          {t.whereWhen}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.destination}</label>
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} placeholder={t.destinationPlaceholder} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" disabled={isLoading} />
          </div>
          
          {/* Waypoints */}
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-700 mb-1">{t.waypointsLabel}</label>
             <div className="space-y-2 mb-2">
                {waypoints.map((wp, i) => (
                    <div key={i} className="flex gap-2">
                        <input type="text" value={wp} onChange={e => updateWaypoint(i, e.target.value)} className="flex-1 px-4 py-2 rounded-lg border border-slate-300 outline-none focus:border-indigo-500" />
                        <button type="button" onClick={() => removeWaypoint(i)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5"/></button>
                    </div>
                ))}
             </div>
             <button type="button" onClick={addWaypoint} className="text-sm text-indigo-600 font-medium flex items-center gap-1"><Plus className="w-4 h-4"/> {t.addStop}</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.startDate}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.endDateLabel}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none" disabled={isLoading} />
          </div>
        </div>
      </div>

      {/* Style & Avoid */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />{t.vibe}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TRAVEL_STYLES.map(s => (
            <button key={s.id} type="button" onClick={() => setStyles(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${styles.includes(s.id) ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200'}`}>
              <s.icon className="w-4 h-4"/> <span className="text-sm">{s.label[language]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Ban className="w-5 h-5 text-red-500" />{t.avoidLabel}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {AVOID_OPTIONS.map(o => (
            <button key={o.id} type="button" onClick={() => setAvoid(prev => prev.includes(o.id) ? prev.filter(x => x !== o.id) : [...prev, o.id])} className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${avoid.includes(o.id) ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200'}`}>
              <o.icon className="w-4 h-4"/> <span className="text-sm">{o.label[language]}</span>
            </button>
          ))}
        </div>
        <input type="text" value={customAvoid} onChange={e => setCustomAvoid(e.target.value)} placeholder={t.customAvoidPlaceholder} className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none" />
      </div>

      {/* Pace, Companions, Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pace */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">{t.pace}</label>
            <div className="space-y-2">
                {PACE_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setPace(opt.id)} disabled={isLoading} className={`w-full text-left px-3 py-2 rounded-lg text-sm border ${pace === opt.id ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}>
                        <div className="font-medium">{opt.label[language]}</div>
                    </button>
                ))}
            </div>
        </div>
        {/* Transport */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">{t.transportMode}</label>
            <div className="grid grid-cols-1 gap-2">
                {TRANSPORT_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setTransportation(opt.id)} disabled={isLoading} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${transportation === opt.id ? 'bg-sky-50 border-sky-500 text-sky-800' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}>
                        <opt.icon className="w-4 h-4 opacity-70" />{opt.label[language]}
                    </button>
                ))}
            </div>
        </div>
        {/* Companions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-slate-800">{t.who}</label>
                <input type="number" min="1" max="20" value={travelers} onChange={(e) => setTravelers(parseInt(e.target.value) || 1)} className="w-12 text-center bg-slate-50 rounded border border-slate-200 text-sm font-bold" />
            </div>
            <div className="grid grid-cols-1 gap-2">
                {COMPANION_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setCompanions(opt.id)} disabled={isLoading} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${companions === opt.id ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}>
                        <opt.icon className="w-4 h-4 opacity-70" />{opt.label[language]}
                    </button>
                ))}
            </div>
        </div>
        {/* Budget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">{t.budget}</label>
            <div className="grid grid-cols-1 gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setBudget(opt.id)} disabled={isLoading} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${budget === opt.id ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'}`}>
                        <opt.icon className="w-4 h-4 opacity-70" />{opt.label[language]}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">{t.wishes}</label>
        <textarea value={customKeywords} onChange={e => setCustomKeywords(e.target.value)} disabled={isLoading} placeholder={t.wishesPlaceholder} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none" />
      </div>
      
      {/* Submit Button */}
      <div className="pt-2">
         {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm mb-4 border border-red-100"><AlertCircle className="w-5 h-5 flex-shrink-0"/>{error}</div>}

         <button type="submit" disabled={isLoading} className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200'}`}>
            {isLoading ? (
               <>
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               {t.planning}
               </>
            ) : (
                <>
                <Sparkles className="w-5 h-5 text-indigo-100" />
                {t.generateBtn}
                </>
            )}
         </button>
      </div>

    </form>
  );
};
