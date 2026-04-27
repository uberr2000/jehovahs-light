'use client';

import { useEffect, useState } from 'react';

interface LighthouseIntroProps {
  onComplete: () => void;
  language: 'en' | 'zh-TW' | 'zh-CN';
}

const translations = {
  en: {
    title: "Jehovah's Light",
    subtitle: "A Beacon of Hope",
    verse: '"The LORD is my light and my salvation— whom shall I fear?"',
    reference: 'Psalm 27:1',
    enter: 'Enter the Light',
  },
  'zh-TW': {
    title: '耶和華的光',
    subtitle: '希望的燈塔',
    verse: '「耶和華是我的亮光，是我的拯救，我還怕誰呢？」',
    reference: '詩篇 27:1',
    enter: '進入光明',
  },
  'zh-CN': {
    title: '耶和华的光',
    subtitle: '希望的灯塔',
    verse: '「耶和华是我的亮光，是我的拯救，我还怕谁呢？」',
    reference: '诗篇 27:1',
    enter: '进入光明',
  },
};

export default function LighthouseIntro({ onComplete, language }: LighthouseIntroProps) {
  const [phase, setPhase] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const t = translations[language];

  useEffect(() => {
    // Animation sequence
    const timer1 = setTimeout(() => setPhase(1), 500);  // Show title
    const timer2 = setTimeout(() => setPhase(2), 1500); // Show subtitle
    const timer3 = setTimeout(() => setPhase(3), 2500); // Show verse
    const timer4 = setTimeout(() => setShowButton(true), 3500); // Show button

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="lighthouse-rays" />
      </div>

      {/* Central lighthouse beacon */}
      <div className="relative z-10 text-center px-4">
        {/* Animated beacon light */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 animate-pulse">
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400/60 via-yellow-500/20 to-transparent rounded-full blur-xl" />
            <div className="absolute inset-4 bg-gradient-radial from-white via-yellow-200 to-transparent rounded-full blur-lg" />
            <div className="absolute inset-8 bg-white rounded-full blur-md" />
          </div>
        </div>

        {/* Title with fade-in animation */}
        <h1 
          className={`text-4xl md:text-6xl font-bold text-white mb-4 transition-all duration-1000 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ textShadow: '0 0 40px rgba(255, 215, 0, 0.5)' }}
        >
          {t.title}
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-xl md:text-2xl text-yellow-200 mb-8 transition-all duration-1000 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {t.subtitle}
        </p>

        {/* Bible verse */}
        <div 
          className={`max-w-lg mx-auto transition-all duration-1000 ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-lg text-gray-300 italic mb-2">
            {t.verse}
          </p>
          <p className="text-sm text-yellow-400">
            — {t.reference}
          </p>
        </div>

        {/* Enter button */}
        <button
          onClick={onComplete}
          className={`mt-12 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold rounded-full 
            hover:from-yellow-400 hover:to-amber-500 transition-all duration-500 
            shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/50
            ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        >
          {t.enter}
        </button>
      </div>

      {/* CSS for animated light rays */}
      <style jsx>{`
        .lighthouse-rays {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200%;
          height: 200%;
          transform: translate(-50%, -50%);
          background: repeating-conic-gradient(
            from 0deg,
            transparent 0deg 10deg,
            rgba(255, 215, 0, 0.03) 10deg 20deg
          );
          animation: rotate 20s linear infinite;
        }
        
        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
