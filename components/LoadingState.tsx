
import React from 'react';
import { Plane, Map, Sun, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface LoadingStateProps {
    language: Language;
    progressMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ language, progressMessage }) => {
  const t = TRANSLATIONS[language];
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
        <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Plane className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
        </div>
        
        {/* Dynamic Status */}
        <h2 className="text-xl font-bold text-slate-800 mb-2 transition-all duration-300">
            {progressMessage || t.designing}
        </h2>
        
        <p className="text-slate-500 max-w-sm mb-8 min-h-[1.5em]">
            {progressMessage ? t.analyzing : "..."}
        </p>
        
        {/* Steps Visualization */}
        <div className="flex gap-4 text-sm text-slate-400">
            <div className={`flex flex-col items-center gap-2 transition-colors ${!progressMessage ? 'text-indigo-500' : ''}`}>
                <div className={`p-2 rounded-full transition-colors ${!progressMessage ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100'}`}>
                    <Map className="w-4 h-4" />
                </div>
                <span>{t.routing}</span>
            </div>
            <div className="w-8 h-px bg-slate-200 mt-4"></div>
            <div className={`flex flex-col items-center gap-2 transition-colors ${progressMessage ? 'text-indigo-500' : ''}`}>
                <div className={`p-2 rounded-full transition-colors ${progressMessage ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100'}`}>
                    <Sun className="w-4 h-4" />
                </div>
                <span>{t.curating}</span>
            </div>
        </div>
    </div>
  );
};
