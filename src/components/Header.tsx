import React from 'react';
import { Sun, Moon, Phone } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

const LOGO_URL = 'https://i.postimg.cc/44pJ0vXw/logo.png';

export const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-[#0f1215]/70 border-b border-windmar-blue-light/30 dark:border-white/[0.08] transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center justify-center"
          >
            <img
              src={LOGO_URL}
              alt="Windmar Home"
              className="h-16 md:h-20 lg:h-24 transition-all drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-lg md:text-xl lg:text-2xl font-black tracking-tighter text-windmar-blue-dark dark:text-[#e8eaed] leading-none uppercase">
              Windmar Proyecto Completo
            </h1>
            <p className="text-[10px] md:text-[12px] text-windmar-blue dark:text-[#a0a4ad] font-bold mt-1 tracking-tight">
              Roofing · Solar · Baterías
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Theme Toggle estilo roofing-pro */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1a1d25] p-1 pr-3 rounded-full border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <motion.button
              onClick={() => setIsDarkMode(!isDarkMode)}
              animate={{ rotate: isDarkMode ? 360 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className={`p-1.5 rounded-full transition-colors duration-500 ${
                isDarkMode
                  ? 'bg-windmar-gold text-windmar-blue-dark shadow-[0_0_10px_rgba(248,155,36,0.3)]'
                  : 'bg-windmar-blue text-white shadow-[0_0_10px_rgba(29,66,155,0.2)]'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </motion.button>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[8px] font-black text-slate-400 dark:text-[#6b7280] uppercase tracking-tighter">
                Tema
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-windmar-gold' : 'text-windmar-blue'}`}>
                {isDarkMode ? 'Oscuro' : 'Claro'}
              </span>
            </div>
          </div>

          {/* Línea Windmar Home */}
          <div className="flex flex-col items-center md:items-end gap-0">
            <div className="flex items-center gap-2 text-windmar-gold">
              <Phone className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              <span className="text-base md:text-lg font-black tracking-tight">787-395-7766</span>
            </div>
            <p className="text-[9px] font-black text-windmar-blue dark:text-[#a0a4ad] uppercase tracking-[0.15em]">
              Línea Windmar Home
            </p>
            <div className="hidden md:flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              <span>Telemercadeo · 811</span>
              <span>Ventas · 839</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
