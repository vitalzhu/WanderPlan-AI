import React, { useState } from 'react';
import { TravelForm } from './components/TravelForm';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { LoadingState } from './components/LoadingState';
import { TravelPreferences, TravelPlan, Language } from './types';
import { generateItinerary } from './services/geminiService';
import { Compass, Github, Globe, Map } from 'lucide-react';
import { TRANSLATIONS } from './translations';

function App() {
  const [view, setView] = useState<'form' | 'loading' | 'result'>('form');
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh');
  const [lastPrefs, setLastPrefs] = useState<TravelPreferences | null>(null);

  const t = TRANSLATIONS[language];

  const handleFormSubmit = async (prefs: TravelPreferences) => {
    setLastPrefs(prefs); // Save preferences for future editing
    setView('loading');
    setError(null);
    try {
      const result = await generateItinerary(prefs, language);
      setPlan(result);
      setView('result');
    } catch (err) {
      console.error(err);
      setError(t.errorGen);
      setView('form');
    }
  };

  const resetApp = () => {
    setPlan(null);
    setLastPrefs(null); // Clear history
    setView('form');
    setError(null);
  };

  const backToForm = () => {
    setView('form');
  };

  const returnToPlan = () => {
    setView('result');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <Compass className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">{t.appTitle}</span>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
             >
                <Globe className="w-4 h-4" />
                {language === 'zh' ? 'EN' : '中文'}
             </button>
             <div className="text-xs font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600 hidden sm:block">
               {t.poweredBy}
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {view === 'form' && (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                {t.heroTitle}
              </h1>
              {t.heroSubtitle && (
                <p className="text-slate-600 max-w-xl mx-auto text-lg">
                  {t.heroSubtitle}
                </p>
              )}
            </div>
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm font-medium">
                    {error}
                </div>
            )}
            
            {/* Travel Form */}
            <TravelForm 
                onSubmit={handleFormSubmit} 
                isLoading={false} 
                language={language} 
                initialValues={lastPrefs} 
                key={lastPrefs ? 'editing' : 'new'} // Re-mount if initialValues change to ensure hydration
            />

            {/* Floating Return Button */}
            {plan && (
                <div className="fixed bottom-6 right-6 z-20 animate-fade-in-up">
                    <button 
                        onClick={returnToPlan}
                        className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl px-5 py-3 rounded-full font-bold flex items-center gap-2 transition-transform transform hover:scale-105"
                    >
                        <Map className="w-5 h-5" />
                        {t.returnToPlan}
                    </button>
                </div>
            )}
          </>
        )}

        {view === 'loading' && <LoadingState language={language} />}

        {view === 'result' && plan && (
          <ItineraryDisplay 
            plan={plan} 
            onReset={resetApp} 
            onBack={backToForm}
            language={language} 
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-8 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {t.footer}</p>
      </footer>

    </div>
  );
}

export default App;