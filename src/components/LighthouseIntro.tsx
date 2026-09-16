'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface LighthouseIntroProps {
  onComplete: () => void;
}

export default function LighthouseIntro({ onComplete }: LighthouseIntroProps) {
  const t = useTranslations('lighthouse');
  const [phase, setPhase] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 500);
    const timer2 = setTimeout(() => setPhase(2), 1500);
    const timer3 = setTimeout(() => setPhase(3), 2500);
    const timer4 = setTimeout(() => setShowButton(true), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="lighthouse-rays" />
      </div>

      <div className="relative z-10 text-center px-4">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 animate-pulse">
            <div className="absolute inset-0 bg-gradient-radial from-yellow-400/60 via-yellow-500/20 to-transparent rounded-full blur-xl" />
            <div className="absolute inset-4 bg-gradient-radial from-white via-yellow-200 to-transparent rounded-full blur-lg" />
            <div className="absolute inset-8 bg-white rounded-full blur-md" />
          </div>
        </div>

        <h1
          className={`text-4xl md:text-6xl font-bold text-white mb-4 transition-all duration-1000 ${
            phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ textShadow: '0 0 40px rgba(255, 215, 0, 0.5)' }}
        >
          {t('title')}
        </h1>

        <p
          className={`text-xl md:text-2xl text-yellow-200 mb-8 transition-all duration-1000 ${
            phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {t('subtitle')}
        </p>

        <div
          className={`max-w-lg mx-auto transition-all duration-1000 ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-lg text-gray-300 italic mb-2">{t('verse')}</p>
          <p className="text-sm text-yellow-400">— {t('reference')}</p>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className={`mt-12 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold rounded-full
            hover:from-yellow-400 hover:to-amber-500 transition-all duration-500
            shadow-lg shadow-yellow-500/30 hover:shadow-yellow-400/50
            ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        >
          {t('enter')}
        </button>
      </div>

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
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
