import React from 'react';
import { Product, PaymentMode } from '../types';
import { MODE_LABELS } from '../constants';
import { Users, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  mode: PaymentMode;
  onAddToCart: (product: Product, installments?: 18 | 61) => void;
  isInCart: boolean;
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export const ProductCard: React.FC<ProductCardProps> = ({ product, mode, onAddToCart, isInCart }) => {
  const [selectedInstallments, setSelectedInstallments] = React.useState<18 | 61>(18);
  const price = product.prices[mode];
  const isUnavailable = price === null;

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case 'Calentadores': return 'bg-blue-50 text-blue-700';
      case 'Cisternas': return 'bg-emerald-50 text-emerald-700';
      case 'Sistemas de tratamiento': return 'bg-amber-50 text-amber-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div 
      draggable="true"
      onDragStart={(e) => {
        e.dataTransfer.setData('productId', product.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`bg-white border border-slate-200 rounded-[22px] overflow-hidden transition-all duration-200 flex flex-col cursor-grab active:cursor-grabbing group hover:shadow-xl hover:shadow-blue-600/10 hover:-translate-y-1 hover:border-blue-200 ${isUnavailable ? 'opacity-55 pointer-events-none' : ''}`}
    >
      <div className="p-4 pb-0 flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getCategoryClass(product.category)}`}>
          {product.category}
        </span>
        {product.personas && (
          <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
            <Users className="w-3 h-3" />
            {product.personas} pers.
          </span>
        )}
      </div>

      <div className="h-48 flex items-center justify-center p-4 relative overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            referrerPolicy="no-referrer" 
            className={`max-h-full max-w-full object-contain transition-transform duration-300 ${product.id === 'cal-80-1p' ? 'group-hover:scale-115' : 'group-hover:scale-105'} ${product.id === 'cis-eco-150' ? 'scale-125' : ''} ${product.category === 'Calentadores' ? (product.id === 'cal-80-2p' ? 'p-5' : (product.id === 'cal-80-1p' ? 'scale-105 translate-y-1' : 'p-1')) : ''}`}
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-bold text-lg">W</div>
        )}
      </div>

      <div className="p-4 pt-1 flex-1 flex flex-col">
        <h3 className="text-base font-bold text-slate-900 mb-1">{product.name}</h3>
        <p className="text-xs text-slate-500 leading-relaxed flex-1 mb-4 line-clamp-2">{product.description}</p>
        
        <div className="border-t border-slate-100 pt-3.5 flex items-end justify-between gap-2">
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Precio {MODE_LABELS[mode]}</div>
            <div className="font-mono text-2xl font-black text-blue-600 drop-shadow-sm">
              {isUnavailable ? <span className="text-sm italic text-slate-400">No disponible</span> : fmt.format(price)}
            </div>
            
            {!isUnavailable && mode === 'cash' && product.cashSinIvu && (
              <div className="mt-3 bg-blue-50 rounded-xl p-3 flex flex-col gap-1.5 border border-blue-100 shadow-sm">
                <div className="flex justify-between items-center text-blue-700">
                  <span className="text-[10px] font-bold uppercase tracking-tight">Sin IVU</span>
                  <span className="font-mono text-base font-bold">{fmt.format(product.cashSinIvu)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-800">
                  <span className="text-[10px] font-bold uppercase tracking-tight">IVU</span>
                  <span className="font-mono text-base font-bold">{fmt.format(product.ivuCash || 0)}</span>
                </div>
              </div>
            )}

            {!isUnavailable && mode === 'synchrony' && (
              <div className="mt-3 space-y-3">
                <div className="bg-blue-50 rounded-xl p-3 flex flex-col gap-1.5 border border-blue-100 shadow-sm">
                  <div className="flex justify-between items-center text-blue-700">
                    <span className="text-[10px] font-bold uppercase tracking-tight">Total Financiado</span>
                    <span className="font-mono text-base font-bold">{fmt.format(product.prices.synchrony || 0)}</span>
                  </div>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200 shadow-inner">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedInstallments(18); }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${selectedInstallments === 18 ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    18 Meses: {fmt.format(product.prices.m18 || 0)}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedInstallments(61); }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${selectedInstallments === 61 ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    61 Meses: {fmt.format(product.prices.m61 || 0)}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            disabled={isUnavailable}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, mode === 'synchrony' ? selectedInstallments : undefined);
            }}
            className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg ${
              isInCart 
                ? 'bg-emerald-500 text-white shadow-emerald-500/25' 
                : 'bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-700 hover:scale-105 active:scale-95'
            } disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed`}
          >
            {isInCart ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
          </button>
        </div>
      </div>
    </div>
  );
};
