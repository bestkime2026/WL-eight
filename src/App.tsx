import React, { useState } from 'react';
import { Game } from './components/Game';
import { Language, translations } from './translations';
import { Globe, Play, BookOpen, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Screen = 'home' | 'game';

export default function App() {
  const [language, setLanguage] = useState<Language>('zh');
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'zh' : 'en');
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center py-4 sm:py-8 px-2 sm:px-4 font-sans">
      <header className="w-full max-w-5xl flex justify-between items-center mb-4 sm:mb-8 px-4">
        <div className="flex items-center gap-4">
          {currentScreen === 'game' && (
            <button 
              onClick={() => setCurrentScreen('home')}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors border border-neutral-700 shadow-sm"
              title={t.backToHome}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            {t.title}
          </h1>
        </div>
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors text-sm sm:text-base border border-neutral-700 shadow-sm"
        >
          <Globe size={18} />
          {language === 'en' ? '中文' : 'English'}
        </button>
      </header>
      
      <main className="flex-grow w-full max-w-5xl flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {currentScreen === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center bg-neutral-800 p-8 sm:p-12 rounded-3xl shadow-2xl border border-neutral-700 max-w-lg w-full text-center"
            >
              <div className="text-6xl mb-6">🃏</div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">{t.title}</h2>
              <p className="text-neutral-400 mb-8 text-sm sm:text-base leading-relaxed">
                {t.rulesText}
              </p>
              
              <button 
                onClick={() => setCurrentScreen('game')}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-lg sm:text-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(5,150,105,0.4)] w-full justify-center"
              >
                <Play fill="currentColor" size={24} />
                {t.startGame}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full flex items-center justify-center"
            >
              <Game language={language} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="mt-8 text-neutral-500 text-xs sm:text-sm text-center">
        Crazy Eights • Built with React & Tailwind CSS
      </footer>
    </div>
  );
}
