import React from 'react';
import { PaymentMode } from '../types';
import { MODE_LABELS } from '../constants';
import { ChevronDown } from 'lucide-react';

interface HeaderProps {
  mode: PaymentMode;
  setMode: (mode: PaymentMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, setMode }) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 py-7 px-0 mb-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
          <img 
            src="https://i.postimg.cc/6T5J2v2G/Thumbnail.png" 
            alt="WindMar" 
            referrerPolicy="no-referrer" 
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Cotizador Water Pro</h1>
          <p className="text-xs text-slate-500 font-normal">Cotizador inteligente de sistemas de agua</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-white border border-slate-200 rounded-full p-1 gap-0.5 shadow-sm">
          <button
            onClick={() => setMode('cash')}
            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              mode === 'cash' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            💵 Cash
          </button>
          
          <button
            onClick={() => setMode('synchrony')}
            className={`px-6 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              mode === 'synchrony' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            🏦 Synchrony
          </button>
        </div>
      </div>
    </header>
  );
};
