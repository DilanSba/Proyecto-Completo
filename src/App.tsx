/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { Cart } from './components/Cart';
import { Product, PaymentMode, CartItem, Category } from './types';
import { PRODUCTS, MODE_LABELS } from './constants';
import { Search, Filter, CheckCircle2, AlertCircle, Home, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export default function App() {
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [hasBonus, setHasBonus] = useState(false);
  const [downPayment, setDownPayment] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplashVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleDrop = (e: any) => {
      const { productId } = e.detail;
      const product = PRODUCTS.find(p => p.id === productId);
      if (product) {
        handleAddToCart(product);
      }
    };
    window.addEventListener('productDropped', handleDrop);
    return () => window.removeEventListener('productDropped', handleDrop);
  }, [mode]); // Re-bind if mode changes to ensure handleAddToCart uses correct mode

  const showToast = (msg: string, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 2200);
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchCat = filterCat === 'all' || p.category === filterCat;
      
      if (!search) return matchCat;

      // Smart multi-word search
      const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
      const searchableText = `${p.name} ${p.category} ${p.description} ${p.personas || ''}`.toLowerCase();
      
      const matchSearch = searchTerms.every(term => searchableText.includes(term));
      
      return matchCat && matchSearch;
    });
  }, [search, filterCat]);

  const handleAddToCart = (product: Product, installments?: 18 | 61) => {
    const price = product.prices[mode];
    if (price === null) {
      showToast('No disponible en este modo', true);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1, installments: installments || item.installments } 
            : item
        );
      }
      return [...prev, { product, quantity: 1, installments: installments || 18 }];
    });
    showToast('Producto agregado ✓');
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.product.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) } 
        : item
    ));
  };

  const handleUpdateInstallments = (id: string, installments: 18 | 61) => {
    setCart(prev => prev.map(item => 
      item.product.id === id 
        ? { ...item, installments } 
        : item
    ));
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
    showToast('Producto eliminado');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Cotización vaciada');
  };

  const handleCopyQuote = async () => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((s, c) => {
      if (mode === 'synchrony' && c.installments) {
        const monthlyPrice = c.installments === 18 ? c.product.prices.m18 : c.product.prices.m61;
        return s + (monthlyPrice || 0) * c.quantity;
      }
      return s + (c.product.prices[mode] || 0) * c.quantity;
    }, 0);

    // RO Discount Logic: $1000 off RO if there's another product
    const hasRO = cart.some(item => item.product.id === 'trat-ro');
    const hasOther = cart.some(item => item.product.id !== 'trat-ro');
    const applyRODiscount = hasRO && hasOther;
    const roDiscountAmount = applyRODiscount ? 1000 : 0;

    const finalTotal = hasBonus 
      ? (mode === 'synchrony' 
          ? total - (500 / (cart[0]?.installments || 18)) - (applyRODiscount ? (1000 / (cart.find(i => i.product.id === 'trat-ro')?.installments || 18)) : 0) - (downPayment / (cart[0]?.installments || 18))
          : total - 500 - roDiscountAmount - downPayment)
      : (applyRODiscount 
          ? (mode === 'synchrony' 
              ? total - (1000 / (cart.find(i => i.product.id === 'trat-ro')?.installments || 18)) - (downPayment / (cart[0]?.installments || 18))
              : total - 1000 - downPayment)
          : (mode === 'synchrony' 
              ? total - (downPayment / (cart[0]?.installments || 18))
              : total - downPayment));

    const modeLabel = MODE_LABELS[mode];
    
    const lines = [
      '🌊 COTIZADOR WATER PRO',
      `Modo de pago: ${modeLabel}`,
      hasBonus ? '🎁 Bono Instala & Gana: -$500.00 aplicado' : '',
      applyRODiscount ? '✨ Descuento Combo RO: -$1,000.00 aplicado' : '',
      downPayment > 0 ? `💰 Pronto (Down Payment): -${fmt.format(downPayment)} aplicado` : '',
      '─'.repeat(34),
      ...cart.map(item => {
        const price = mode === 'synchrony' 
          ? (item.installments === 18 ? item.product.prices.m18 : item.product.prices.m61)
          : item.product.prices[mode];
        
        let line = `• ${item.product.name} ×${item.quantity}  →  ${fmt.format((price || 0) * item.quantity)}`;
        
        if (mode === 'cash' && item.product.cashSinIvu) {
          line += `\n  (Sin IVU: ${fmt.format(item.product.cashSinIvu * item.quantity)} | IVU: ${fmt.format((item.product.ivuCash || 0) * item.quantity)})`;
        }
        
        if (mode === 'synchrony') {
          line += ` (${item.installments} meses)`;
          line += `\n  (Total Financiado: ${fmt.format((item.product.prices.synchrony || 0) * item.quantity)})`;
        }
        
        return line;
      }),
      '─'.repeat(34),
      `${mode === 'synchrony' ? 'TOTAL MENSUAL' : 'TOTAL'}: ${fmt.format(finalTotal)}`,
    ];

    if (mode === 'cash') {
      const sinIvu = cart.reduce((s, c) => s + (c.product.cashSinIvu || 0) * c.quantity, 0);
      const ivu = cart.reduce((s, c) => s + (c.product.ivuCash || 0) * c.quantity, 0);
      
      let finalSinIvu = hasBonus ? sinIvu - 448.43 : sinIvu; 
      let finalIvu = hasBonus ? ivu - 51.57 : ivu;

      if (applyRODiscount) {
        finalSinIvu -= 896.86; // 1000 / 1.115
        finalIvu -= 103.14;
      }

      if (downPayment > 0) {
        finalSinIvu -= (downPayment / 1.115);
        finalIvu -= (downPayment - (downPayment / 1.115));
      }

      if (sinIvu > 0) {
        lines.push(`Total Sin IVU: ${fmt.format(finalSinIvu)}`);
        lines.push(`Total IVU: ${fmt.format(finalIvu)}`);
        lines.push('─'.repeat(34));
      }
    }

    if (mode === 'synchrony') {
      const totalFinanciado = cart.reduce((s, c) => s + (c.product.prices.synchrony || 0) * c.quantity, 0);
      let finalFinanciado = hasBonus ? totalFinanciado - 500 : totalFinanciado;
      if (applyRODiscount) finalFinanciado -= 1000;
      if (downPayment > 0) finalFinanciado -= downPayment;
      
      lines.push(`Total Financiado: ${fmt.format(finalFinanciado)}`);
      lines.push('─'.repeat(34));
    }

    lines.push('');
    lines.push('Agente: Dilan Buitrago | Windmar Home Puerto Rico');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Cotización copiada');
    } catch (e) {
      showToast('Error al copiar', true);
    }
  };

  const handleWhatsApp = () => {
    if (cart.length === 0) return;
    
    const total = cart.reduce((s, c) => {
      if (mode === 'synchrony' && c.installments) {
        const monthlyPrice = c.installments === 18 ? c.product.prices.m18 : c.product.prices.m61;
        return s + (monthlyPrice || 0) * c.quantity;
      }
      return s + (c.product.prices[mode] || 0) * c.quantity;
    }, 0);

    // RO Discount Logic
    const hasRO = cart.some(item => item.product.id === 'trat-ro');
    const hasOther = cart.some(item => item.product.id !== 'trat-ro');
    const applyRODiscount = hasRO && hasOther;
    const roDiscountAmount = applyRODiscount ? 1000 : 0;

    const finalTotal = hasBonus 
      ? (mode === 'synchrony' 
          ? total - (500 / (cart[0]?.installments || 18)) - (applyRODiscount ? (1000 / (cart.find(i => i.product.id === 'trat-ro')?.installments || 18)) : 0) - (downPayment / (cart[0]?.installments || 18))
          : total - 500 - roDiscountAmount - downPayment)
      : (applyRODiscount 
          ? (mode === 'synchrony' 
              ? total - (1000 / (cart.find(i => i.product.id === 'trat-ro')?.installments || 18)) - (downPayment / (cart[0]?.installments || 18))
              : total - 1000 - downPayment)
          : (mode === 'synchrony' 
              ? total - (downPayment / (cart[0]?.installments || 18))
              : total - downPayment));

    const modeLabel = MODE_LABELS[mode];
    const itemsText = cart.map(c => {
      const price = mode === 'synchrony' 
        ? (c.installments === 18 ? c.product.prices.m18 : c.product.prices.m61)
        : c.product.prices[mode];
      return `• ${c.product.name} ×${c.quantity}: ${fmt.format((price || 0) * c.quantity)}${mode === 'synchrony' ? ` (${c.installments} meses)` : ''}`;
    }).join('\n');

    let msg = `🌊 *COTIZADOR WATER PRO*\nModo: ${modeLabel}\n${hasBonus ? '🎁 *Bono Instala & Gana: -$500.00 aplicado*\n' : ''}${applyRODiscount ? '✨ *Descuento Combo RO: -$1,000.00 aplicado*\n' : ''}${downPayment > 0 ? `💰 *Pronto (Down Payment): -${fmt.format(downPayment)} aplicado*\n` : ''}\n${itemsText}\n\n*${mode === 'synchrony' ? 'TOTAL MENSUAL' : 'TOTAL'}: ${fmt.format(finalTotal)}*`;
    
    if (mode === 'synchrony') {
      const totalFinanciado = cart.reduce((s, c) => s + (c.product.prices.synchrony || 0) * c.quantity, 0);
      let finalFinanciado = hasBonus ? totalFinanciado - 500 : totalFinanciado;
      if (applyRODiscount) finalFinanciado -= 1000;
      if (downPayment > 0) finalFinanciado -= downPayment;
      msg += `\n*Total Financiado: ${fmt.format(finalFinanciado)}*`;
    }
    
    msg += `\n\nAgente: Windmar Home PR`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <AnimatePresence>
        {isSplashVisible && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Water Wave Background - More Layers */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <motion.div 
                animate={{ 
                  y: [0, -30, 0],
                  rotate: [0, 3, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] left-[-10%] right-[-10%] h-[70vh] bg-blue-500/30 blur-3xl rounded-[100%]"
              />
              <motion.div 
                animate={{ 
                  y: [0, -40, 0],
                  rotate: [0, -4, 0],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-15%] left-[-20%] right-[-20%] h-[60vh] bg-cyan-400/25 blur-3xl rounded-[100%]"
              />
              <motion.div 
                animate={{ 
                  y: [0, -25, 0],
                  x: [-10, 10, -10]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] bg-blue-300/10 blur-3xl rounded-full"
              />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <motion.img 
                  animate={{ 
                    y: [0, -15, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-80 h-80 object-contain drop-shadow-2xl" 
                  src="https://i.postimg.cc/6T5J2v2G/Thumbnail.png" 
                  alt="WindMar Logo" 
                  referrerPolicy="no-referrer" 
                />
              </motion.div>

              <div className="text-center">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mb-2"
                >
                  Cargando Cotizador
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent uppercase tracking-widest"
                >
                  Water Pro
                </motion.div>
                
                {/* Loading Bar Container */}
                <div className="mt-8 w-64 mx-auto">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.3, 1, 0.3] 
                    }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
                  />
                ))}
              </div>
            </div>

            {/* Multiple Animated SVG Waves for Depth */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180">
              <svg className="relative block w-[calc(100%+1.3px)] h-[180px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <motion.path 
                  animate={{ 
                    d: [
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58,10.79,114.16,30.13,172,41.86,82.39,16.72,168.19,17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                    ]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  className="fill-blue-600/15"
                ></motion.path>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform rotate-180 opacity-50">
              <svg className="relative block w-[calc(120%+1.3px)] h-[120px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <motion.path 
                  animate={{ 
                    d: [
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58,10.79,114.16,30.13,172,41.86,82.39,16.72,168.19,17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                      "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                    ]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                  className="fill-blue-400/10"
                ></motion.path>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1360px] mx-auto px-5 pb-20">
        <Header mode={mode} setMode={setMode} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-start">
          <main>
            <div className="relative mb-4 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px] group-focus-within:text-blue-500 transition-colors" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full py-4 pl-11 pr-12 bg-white border-2 border-slate-100 rounded-2xl text-[15px] outline-none shadow-sm focus:border-blue-500/50 focus:bg-blue-50/10 transition-all placeholder:text-slate-400 font-medium"
                placeholder="Busca cualquier palabra (ej: 'filtro 3 personas' o 'cisterna 600')…" 
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-5">
              {(['all', 'Calentadores', 'Cisternas', 'Sistemas de tratamiento'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all ${
                    filterCat === cat 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat === 'Calentadores' ? '🌡 Calentadores' : cat === 'Cisternas' ? '🏺 Cisternas' : '🔬 Tratamiento'}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 mb-4">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-16 px-5 bg-white border-2 border-dashed border-slate-100 rounded-[22px]">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">No encontramos lo que buscas</h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-[280px] mx-auto">Prueba con palabras más generales o revisa otra categoría.</p>
                  <button 
                    onClick={() => { setSearch(''); setFilterCat('all'); }}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                  >
                    Ver todos los productos
                  </button>
                </div>
              ) : (
                filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    mode={mode} 
                    onAddToCart={handleAddToCart}
                    isInCart={cart.some(item => item.product.id === product.id)}
                  />
                ))
              )}
            </div>
          </main>

          <aside>
            <Cart 
              items={cart} 
              mode={mode} 
              hasBonus={hasBonus}
              downPayment={downPayment}
              onToggleBonus={() => setHasBonus(!hasBonus)}
              onUpdateDownPayment={setDownPayment}
              onUpdateQty={handleUpdateQty}
              onUpdateInstallments={handleUpdateInstallments}
              onRemoveItem={handleRemoveItem}
              onClear={handleClearCart}
              onCopy={handleCopyQuote}
              onWhatsApp={handleWhatsApp}
            />
          </aside>
        </div>

        <footer className="text-center pt-10 text-slate-400">
          <div className="text-[11px] uppercase tracking-[0.15em] text-blue-500 mb-4">Herramienta de Apoyo para Ventas · Windmar Home Puerto Rico</div>
          <div className="text-[11px] leading-relaxed max-w-[520px] mx-auto mb-4">
            © 2026 Windmar Home. Todos los derechos reservados. Los precios mostrados son referenciales y pueden variar según la configuración final del sistema y promociones vigentes.
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 30, x: "-50%" }}
            className="fixed bottom-7 left-1/2 z-[500] bg-slate-800 text-white px-5 py-2.5 rounded-full text-[13px] font-semibold flex items-center gap-2 shadow-2xl"
          >
            {toast.isError ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
