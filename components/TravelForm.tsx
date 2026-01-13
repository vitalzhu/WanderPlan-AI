import React, { useState, useEffect } from 'react';
import { TravelPreferences, Language } from '../types';
import { TRAVEL_STYLES, PACE_OPTIONS, COMPANION_OPTIONS, BUDGET_OPTIONS, TRANSPORT_OPTIONS, AVOID_OPTIONS } from '../constants';
import { TRANSLATIONS } from '../translations';
import { MapPin, Calendar, Sparkles, AlertCircle, Clock, Plus, Trash2, Ban } from 'lucide-react';

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
  const [avoid, setAvoid] = useState<string[]>(initialValues?.avoid || []);
  const [pace, setPace] = useState(initialValues?.pace || 'Balanced');
  const [transportation, setTransportation] = useState(initialValues?.transportation || 'Public Transit');
  const [companions, setCompanions] = useState(initialValues?.companions || 'Couple');
  const [budget, setBudget] = useState(initialValues?.budget || 'Mid-range');
  const [customKeywords, setCustomKeywords] = useState(initialValues?.customKeywords || '');
  const [error, setError] = useState('');

  const t = TRANSLATIONS[language];

  // Set default start date to tomorrow and end date to +3 days ONLY if not provided
  useEffect(() => {
    if (initialValues) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startStr = tomorrow.toISOString().split('T')[0];
    setStartDate(startStr);

    const afterTomorrow = new Date(tomorrow);
    afterTomorrow.setDate(tomorrow.getDate() + 2); // Default 3 day trip
    setEndDate(afterTomorrow.toISOString().split('T')[0]);
  }, [initialValues]);

  // Ensure end date updates if start date moves past it
  useEffect(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        setEndDate(startDate);
    }
  }, [startDate, endDate]);

  // Auto-adjust travelers count based on companion selection
  useEffect(() => {
    if (initialValues) return; // Skip auto-adjust if editing existing plan to respect saved value
    if (companions === 'Solo') setTravelers(1);
    else if (companions === 'Couple') setTravelers(2);
    else if (travelers < 2) setTravelers(2);
  }, [companions, travelers, initialValues]);

  const toggleStyle = (style: string) => {
    setStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style) 
        : [...prev, style]
    );
  };

  const toggleAvoid = (option: string) => {
    setAvoid(prev => 
      prev.includes(option) 
        ? prev.filter(s => s !== option) 
        : [...prev, option]
    );
  };

  const calculateDays = (start: string, end: string): number => {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = e.getTime() - s.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const addWaypoint = () => {
    setWaypoints([...waypoints, '']);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = [...waypoints];
    newWaypoints.splice(index, 1);
    setWaypoints(newWaypoints);
  };

  const updateWaypoint = (index: number, value: string) => {
    const newWaypoints = [...waypoints];
    newWaypoints[index] = value;
    setWaypoints(newWaypoints);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addWaypoint();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError(t.errorDest);
      return;
    }
    if (!startDate) {
        setError(t.errorDate);
        return;
    }
    if (!endDate) {
        setError(t.errorEndDate);
        return;
    }
    
    const days = calculateDays(startDate, endDate);

    if (days < 1) {
        setError(t.errorEndDate);
        return;
    }
    if (days > 14) {
      setError(t.errorDays);
      return;
    }
    if (styles.length === 0) {
        setError(t.errorStyle);
        return;
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
      avoid,
      pace,
      transportation,
      companions,
      budget,
      customKeywords
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8 p-1">
      
      {/* Destination & Duration & Date */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-500" />
          {t.whereWhen}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Main Destination */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.destination}</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t.destinationPlaceholder}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Waypoints */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.waypointsLabel}</label>
            <div className="space-y-3 mb-2">
                {waypoints.map((wp, index) => (
                    <div key={index} className="flex gap-2 items-center group">
                        <div className="flex flex-col items-center justify-center self-stretch w-5 pt-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-300 group-hover:bg-indigo-500 transition-colors"></div>
                             {/* Line connector */}
                             <div className="w-0.5 bg-indigo-100 flex-1 my-1"></div>
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={wp}
                                onChange={(e) => updateWaypoint(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                placeholder={t.stopoverPlaceholder}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => removeWaypoint(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
            <button 
                type="button" 
                onClick={addWaypoint}
                disabled={isLoading}
                className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-1 py-1 rounded-md hover:bg-indigo-50 transition-colors ml-1"
            >
                <Plus className="w-4 h-4" /> {t.addStop}
            </button>
          </div>

          <div className="h-px bg-slate-100 md:col-span-2 my-2"></div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.startDate}</label>
            <div className="relative">
                <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pl-10"
                    disabled={isLoading}
                />
                <Clock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.endDateLabel}</label>
            <div className="relative">
                <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pl-10"
                    disabled={isLoading}
                />
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
            </div>
            {startDate && endDate && (
                <div className="text-xs text-slate-500 mt-1 text-right">
                    {calculateDays(startDate, endDate) > 0 ? `${calculateDays(startDate, endDate)} ${t.daysUnit}` : ''}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Travel Style */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          {t.vibe}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TRAVEL_STYLES.map((style) => {
             const Icon = style.icon;
             const isSelected = styles.includes(style.id);
             return (
              <button
                key={style.id}
                type="button"
                onClick={() => toggleStyle(style.id)}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  isSelected 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-sm">{style.label[language]}</span>
              </button>
             );
          })}
        </div>
      </div>

      {/* Avoid Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" />
          {t.avoidLabel}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVOID_OPTIONS.map((opt) => {
             const Icon = opt.icon;
             const isSelected = avoid.includes(opt.id);
             return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleAvoid(opt.id)}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                  isSelected 
                    ? 'bg-red-50 border-red-500 text-red-700 font-medium' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-slate-400'}`} />
                <span className="text-sm">{opt.label[language]}</span>
              </button>
             );
          })}
        </div>
      </div>

      {/* Pace, Companions, Budget, Transport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pace */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">{t.pace}</label>
            <div className="space-y-2">
                {PACE_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPace(opt.id)}
                        disabled={isLoading}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                            pace === opt.id
                             ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                             : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <div className="font-medium">{opt.label[language]}</div>
                        <div className="text-xs opacity-70 truncate">{opt.description[language]}</div>
                    </button>
                ))}
            </div>
        </div>

        {/* Transport */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">{t.transportMode}</label>
            <div className="grid grid-cols-1 gap-2">
                {TRANSPORT_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTransportation(opt.id)}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                            transportation === opt.id
                             ? 'bg-sky-50 border-sky-500 text-sky-800'
                             : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <opt.icon className="w-4 h-4 opacity-70" />
                        {opt.label[language]}
                    </button>
                ))}
            </div>
        </div>

        {/* Companions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-slate-800">{t.who}</label>
                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">{t.travelers}</span>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={travelers}
                        onChange={(e) => setTravelers(parseInt(e.target.value) || 1)}
                        className="w-8 text-center bg-transparent text-sm font-bold text-slate-700 outline-none"
                        disabled={isLoading}
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
                {COMPANION_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCompanions(opt.id)}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                            companions === opt.id
                             ? 'bg-blue-50 border-blue-500 text-blue-800'
                             : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <opt.icon className="w-4 h-4 opacity-70" />
                        {opt.label[language]}
                    </button>
                ))}
            </div>
        </div>

        {/* Budget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-semibold text-slate-800 mb-3">{t.budget}</label>
            <div className="grid grid-cols-1 gap-2">
                {BUDGET_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBudget(opt.id)}
                        disabled={isLoading}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                            budget === opt.id
                             ? 'bg-amber-50 border-amber-500 text-amber-800'
                             : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <opt.icon className="w-4 h-4 opacity-70" />
                        {opt.label[language]}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Optional Keywords */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-sm font-medium text-slate-700 mb-2">{t.wishes}</label>
        <textarea
            value={customKeywords}
            onChange={(e) => setCustomKeywords(e.target.value)}
            disabled={isLoading}
            placeholder={t.wishesPlaceholder}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-[0.99] ${
            isLoading 
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
        }`}
      >
        {isLoading ? t.planning : t.generateBtn}
      </button>

    </form>
  );
};