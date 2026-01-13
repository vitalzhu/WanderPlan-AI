import React from 'react';
import { Plane, Map, Sun } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface LoadingStateProps {
    language: Language;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ language }) => {
  const t = TRANSLATIONS[language];
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Plane className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t.designing}</h2>
        <p className="text-slate-500 max-w-sm">
            {t.analyzing}
        </p>
        
        <div className="mt-8 flex gap-4 text-sm text-slate-400">
            <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-full"><Map className="w-4 h-4" /></div>
                <span>{t.routing}</span>
            </div>
            <div className="w-8 h-px bg-slate-200 mt-4"></div>
            <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-100 rounded-full"><Sun className="w-4 h-4" /></div>
                <span>{t.curating}</span>
            </div>
        </div>
    </div>
  );
};
