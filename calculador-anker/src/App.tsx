import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Copy, 
  RotateCcw, 
  CreditCard, 
  DollarSign,
  Info,
  CheckCircle2,
  ChevronRight,
  Package,
  Calculator,
  User,
  Share2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS, Product } from './constants';

interface CartItem {
  id: string;
  qty: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function App() {
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMode, setPriceMode] = useState<'cash' | 'sync'>('cash');
  const [syncTerm, setSyncTerm] = useState<'12' | '24' | '48'>('12');
  const [downPayment, setDownPayment] = useState<number>(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Load cart from local storage
  useEffect(() => {
    const saved = localStorage.getItem('anker_cart_v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCart(parsed.cart || {});
        setDownPayment(parsed.downPayment || 0);
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    }
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('anker_cart_v5', JSON.stringify({ cart, downPayment }));
  }, [cart, downPayment]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (type === 'error') {
      setIsErrorState(true);
      setTimeout(() => setIsErrorState(false), 2000);
    }
    setTimeout(() => setToast(null), 2000);
  };

  const addToCart = (id: string) => {
    // Compatibility Logic
    const incompatibleWith3800 = ['PANEL_200W', 'PANEL_200W_50', 'TRANSFER_SWITH_MANUAL', 'TRANSFER_SWITH_MANUAL_APTO'];
    
    if (id === 'ANKER_SOLIX_3800') {
      const hasIncompatible = incompatibleWith3800.some(itemId => cart[itemId]);
      if (hasIncompatible) {
        showToast('NO COMPATIBLE con equipos seleccionados', 'error');
        return;
      }
    }

    if (incompatibleWith3800.includes(id)) {
      if (cart['ANKER_SOLIX_3800']) {
        showToast('NO COMPATIBLE con Anker Solix 3800', 'error');
        return;
      }
    }

    // Compatibility Logic for F2600/BP2600 and Automatic Transfer Switch
    const autoTransferSwitches = ['TRANSFER_SWITH_AUTOMATICO', 'TRANSFER_SWITH_AUTOMATICO_APTO'];
    const incompatibleWithAutoTransfer = ['ANKER_SOLIX_F2600', 'EXPANSION_BATTERY_BP2600'];

    if (autoTransferSwitches.includes(id)) {
      const hasIncompatible = incompatibleWithAutoTransfer.some(itemId => cart[itemId]);
      if (hasIncompatible) {
        showToast('NO COMPATIBLE con equipos seleccionados', 'error');
        return;
      }
    }

    if (incompatibleWithAutoTransfer.includes(id)) {
      const hasAutoTransfer = autoTransferSwitches.some(itemId => cart[itemId]);
      if (hasAutoTransfer) {
        showToast('NO COMPATIBLE con Transfer Switch Automático', 'error');
        return;
      }
    }

    setCart(prev => ({
      ...prev,
      [id]: { id, qty: (prev[id]?.qty || 0) + 1 }
    }));
    showToast('Producto agregado');
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id];
      if (!current) return prev;
      const nextQty = Math.max(1, current.qty + delta);
      return {
        ...prev,
        [id]: { ...current, qty: nextQty }
      };
    });
  };

  const resetCart = () => {
    setCart({});
    setDownPayment(0);
    showToast('Cotizador reiniciado');
  };

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const getUnitPrice = (p: Product) => {
    if (priceMode === 'cash') return p.cash;
    if (syncTerm === '12') return p.pay12;
    if (syncTerm === '24') return p.pay24;
    return p.pay48;
  };

  const totals = useMemo(() => {
    const items = Object.values(cart) as CartItem[];
    
    // Total Cash
    const totalCash = items.reduce((acc, it) => {
      const p = PRODUCTS.find(x => x.id === it.id);
      return acc + (p ? p.cash * it.qty : 0);
    }, 0);

    // Total Sync Price (The full price if financed)
    const totalSyncPrice = items.reduce((acc, it) => {
      const p = PRODUCTS.find(x => x.id === it.id);
      return acc + (p ? p.syncPrice * it.qty : 0);
    }, 0);

    let total = 0; // This will be the "Main Total" (Cash Total or Monthly Payment)
    let totalFinanced = 0; // This will be the "Total Financed" (Total Sync Price - Down Payment)

    if (priceMode === 'cash') {
      total = totalCash;
      totalFinanced = totalCash;
    } else {
      // Financing mode
      const term = parseInt(syncTerm);
      const baseAmount = syncTerm === '12' ? totalCash : totalSyncPrice;
      totalFinanced = Math.max(0, baseAmount - downPayment);
      total = totalFinanced / term;
    }

    const count = items.reduce((acc, it) => acc + it.qty, 0);
    return { total, totalFinanced, count, lines: items.length, baseAmount: priceMode === 'cash' ? totalCash : (syncTerm === '12' ? totalCash : totalSyncPrice) };
  }, [cart, priceMode, syncTerm, downPayment]);

  const copySummary = async () => {
    const items = Object.values(cart) as CartItem[];
    const header = priceMode === 'cash' 
      ? 'Modo: PRECIO / CASH' 
      : `Modo: PRECIO CON SYNCHRONY · ${syncTerm} meses (pago mensual)`;
    
    const lines = items.map(it => {
      const p = PRODUCTS.find(x => x.id === it.id);
      if (!p) return '';
      const u = getUnitPrice(p);
      let line = `- ${p.name} | ${currencyFormatter.format(u)} x ${it.qty} = ${currencyFormatter.format(u * it.qty)}`;
      if (priceMode === 'sync') {
        line += `\n  (Total financiado: ${currencyFormatter.format(p.syncPrice * it.qty)})`;
      }
      return line;
    }).join('\n');

    let summaryText = `Cotización Anker Pro\n${header}\n\n${lines}\n\n`;
    
    if (priceMode === 'sync' && downPayment > 0) {
      summaryText += `PRONTO (Down Payment): ${currencyFormatter.format(downPayment)}\n`;
      summaryText += `BALANCE A FINANCIAR: ${currencyFormatter.format(totals.totalFinanced)}\n\n`;
    }

    summaryText += `${priceMode === 'cash' ? 'TOTAL' : 'TOTAL FINANCIADO'}: ${currencyFormatter.format(priceMode === 'cash' ? totals.total : totals.totalFinanced)}${priceMode === 'sync' ? `\nCUOTA MENSUAL (${syncTerm}m): ${currencyFormatter.format(totals.total)}` : ''}\n\nGenerado por Windmar Home`;

    try {
      await navigator.clipboard.writeText(summaryText);
      showToast('Resumen copiado al portapapeles');
    } catch (err) {
      showToast('Error al copiar', 'error');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden"
          >
            {/* Energy Background Effect */}
            <div className="absolute inset-0">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-windmar-blue rounded-full blur-[150px]"
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-windmar-orange rounded-full blur-[120px]"
              />
              
              {/* Electric Sparks - Shooting from center to outside */}
              {[...Array(40)].map((_, i) => {
                const angle = (i / 40) * Math.PI * 2;
                const distance = 400 + Math.random() * 300;
                const startOffset = 40 + Math.random() * 40;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.2, 0.5],
                      x: [Math.cos(angle) * startOffset, Math.cos(angle) * distance],
                      y: [Math.sin(angle) * startOffset, Math.sin(angle) * distance]
                    }}
                    transition={{ 
                      duration: 0.6 + Math.random() * 0.4,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: "easeOut"
                    }}
                    className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-blue-400 rounded-full blur-[1px] shadow-[0_0_15px_#60a5fa]"
                    style={{ rotate: `${(angle * 180) / Math.PI + 90}deg` }}
                  />
                );
              })}
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex flex-col items-center gap-8 mb-12">
                {/* Windmar Logo - Drops down with zoom */}
                <motion.div
                  initial={{ y: -300, scale: 0.3, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: [0.22, 1, 0.36, 1],
                    type: "spring",
                    damping: 12
                  }}
                  className="w-48 md:w-64 relative"
                >
                  <motion.div
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-white blur-2xl rounded-full"
                  />
                  <img 
                    src="https://i.postimg.cc/44pJ0vXw/logo.png" 
                    alt="Windmar Home" 
                    className="w-full h-auto object-contain relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>

                {/* Central Energy Core */}
                <div className="relative h-24 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="relative"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 2, 1],
                        opacity: [0.3, 0.7, 0.3],
                        rotate: 360
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-16 h-16 -left-8 -top-8 border-2 border-dashed border-windmar-orange rounded-full blur-[2px]"
                    />
                    <motion.div
                      animate={{ 
                        scale: [1, 1.8, 1],
                        opacity: [0.2, 0.6, 0.2],
                        rotate: -360
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-20 h-20 -left-10 -top-10 border border-dashed border-blue-400 rounded-full blur-[1px]"
                    />
                    <div className="relative z-10 flex items-center justify-center">
                      {/* Zap icon removed */}
                    </div>
                  </motion.div>
                </div>

                {/* Anker Logo - Meets Windmar */}
                <motion.div
                  initial={{ y: 300, scale: 0.3, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: [0.22, 1, 0.36, 1],
                    type: "spring",
                    damping: 12,
                    delay: 0.4
                  }}
                  className="w-40 md:w-52 relative"
                >
                  <motion.div
                    animate={{ opacity: [0, 0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute inset-0 bg-white blur-xl rounded-full"
                  />
                  <img 
                    src="https://cdn.freelogovectors.net/wp-content/uploads/2018/06/anker-logo.png" 
                    alt="Anker" 
                    className="w-full h-auto object-contain relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </div>

              {/* Loading Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-72 h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3.5, ease: "easeInOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-windmar-blue via-white to-windmar-orange"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-white/70 font-black tracking-[0.4em] text-[10px] uppercase text-center"
                  >
                    Cargando Cotizador <span className="text-white underline decoration-windmar-orange decoration-2 underline-offset-4">ANKER</span> Pro
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`min-h-screen bg-slate-50 pb-20 transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-strong">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-strong p-2"
              >
                <img 
                  src="https://i.postimg.cc/44pJ0vXw/logo.png" 
                  alt="Windmar Home" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div>
                <h1 className="font-black text-slate-900 text-lg md:text-xl leading-tight tracking-tight">Cotizador Anker Pro</h1>
                <p className="text-[10px] md:text-xs text-windmar-blue font-black uppercase tracking-widest">Windmar Home Specialist Tool</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={resetCart}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Reiniciar cotizador"
              >
                <RotateCcw size={22} />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Catalog */}
            <div className="lg:col-span-8 space-y-4">
              <section className="glass-card p-4 md:p-5 space-y-5 shadow-strong">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <Package className="text-windmar-orange" size={20} />
                      Catálogo de Productos
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      Selecciona o arrastra los equipos
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[8px] text-slate-500">
                        <Share2 size={8} className="rotate-90" /> Drag & Drop
                      </span>
                    </p>
                  </div>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-windmar-blue rounded-xl text-sm font-medium transition-all outline-none shadow-inner-soft"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                      <DollarSign size={12} className="text-windmar-orange" /> Modo de Precio
                    </label>
                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button 
                        onClick={() => setPriceMode('cash')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${priceMode === 'cash' ? 'bg-white text-windmar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        CASH
                      </button>
                      <button 
                        onClick={() => setPriceMode('sync')}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${priceMode === 'sync' ? 'bg-white text-windmar-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        SYNCHRONY
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                      <CreditCard size={12} className="text-windmar-orange" /> Plazo Financiamiento
                    </label>
                    <select 
                      disabled={priceMode === 'cash'}
                      value={syncTerm}
                      onChange={(e) => setSyncTerm(e.target.value as any)}
                      className="w-full py-2.5 px-4 bg-slate-100 border-2 border-transparent focus:bg-white focus:border-windmar-blue rounded-xl text-xs font-bold transition-all outline-none disabled:opacity-50 appearance-none cursor-pointer"
                    >
                      <option value="12">12 Meses (0% Int)</option>
                      <option value="24">24 Meses (Estándar)</option>
                      <option value="48">48 Meses (Mínima)</option>
                    </select>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(product => (
                    <motion.div 
                      layout
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      whileHover={{ y: -4 }}
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('productId', product.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className={`glass-card p-3 flex flex-col justify-between shadow-strong hover:shadow-2xl hover:border-windmar-blue transition-all duration-300 group cursor-grab active:cursor-grabbing ${['ANKER_SOLIX_3800', 'PANEL_400W', 'PANEL_400W_50', 'TRANSFER_SWITH_MANUAL', 'TRANSFER_SWITH_AUTOMATICO', 'TRANSFER_SWITH_MANUAL_APTO', 'TRANSFER_SWITH_AUTOMATICO_APTO'].includes(product.id) ? 'border-windmar-blue/20 bg-blue-50/5' : ''}`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[7px] font-black text-windmar-blue bg-blue-50/80 px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">
                            {product.category}
                          </span>
                        </div>

                        {product.image && (
                          <div className={`w-full ${['ANKER_SOLIX_3800', 'PANEL_400W', 'PANEL_400W_50', 'TRANSFER_SWITH_MANUAL', 'TRANSFER_SWITH_AUTOMATICO', 'TRANSFER_SWITH_MANUAL_APTO', 'TRANSFER_SWITH_AUTOMATICO_APTO'].includes(product.id) ? 'h-52' : 'h-44'} flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-50 group-hover:border-windmar-blue/10 transition-all relative`}>
                            <motion.img 
                              whileHover={{ scale: 1.05 }}
                              src={product.image} 
                              alt={product.name}
                              className={`w-full h-full object-contain relative z-10 transition-transform duration-500 ${['ANKER_SOLIX_3800', 'PANEL_400W', 'PANEL_400W_50', 'TRANSFER_SWITH_MANUAL', 'TRANSFER_SWITH_AUTOMATICO', 'TRANSFER_SWITH_MANUAL_APTO', 'TRANSFER_SWITH_AUTOMATICO_APTO'].includes(product.id) ? 'p-0 scale-125' : 'p-2'}`}
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <h3 className="font-black text-slate-800 text-sm leading-tight group-hover:text-windmar-blue transition-colors min-h-[2rem] flex items-center">
                          {product.name}
                        </h3>
                        <div className="space-y-2 pt-1">
                          <div className="flex justify-between items-end">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              {priceMode === 'cash' ? 'Precio Directo' : 'Total Sync'}
                            </p>
                            {priceMode === 'sync' && (
                              <p className="text-[8px] font-black text-windmar-orange uppercase tracking-[0.2em]">
                                Cuota {syncTerm} Meses
                              </p>
                            )}
                          </div>
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="text-lg font-black text-slate-900 tracking-tight">
                              {currencyFormatter.format(priceMode === 'cash' ? product.cash : product.syncPrice)}
                            </p>
                            {priceMode === 'sync' && (
                              <p className="text-xs font-black text-slate-500 opacity-90">
                                {currencyFormatter.format(getUnitPrice(product))}
                                <span className="text-[9px] font-bold text-slate-400 ml-0.5">/mes</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => addToCart(product.id)}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-windmar-orange text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        <Plus size={14} />
                        Agregar
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Cart */}
            <div className="lg:col-span-4 space-y-4">
              <section 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const id = e.dataTransfer.getData('productId');
                  if (id) addToCart(id);
                }}
                className={`glass-card flex flex-col h-fit lg:sticky lg:top-24 shadow-strong transition-all duration-300 relative overflow-hidden ${isErrorState ? 'border-red-500 animate-shake ring-4 ring-red-500/20' : ''} ${isDraggingOver ? 'ring-4 ring-windmar-orange ring-offset-4 scale-[1.02] bg-orange-50/50' : ''}`}
              >
                <AnimatePresence>
                  {isDraggingOver && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-windmar-orange/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 text-white border-4 border-dashed border-white/40"
                    >
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center"
                      >
                        <Plus size={40} />
                      </motion.div>
                      <span className="font-black text-lg uppercase tracking-[0.2em]">Soltar para Agregar</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`p-5 border-b flex justify-between items-center transition-colors ${isErrorState ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                  <div className="space-y-1">
                    <h2 className={`text-base font-black flex items-center gap-2 transition-colors ${isErrorState ? 'text-red-600' : 'text-slate-800'}`}>
                      <ShoppingCart className={isErrorState ? 'text-red-600' : 'text-slate-800'} size={18} />
                      RESUMEN DE COMPRA
                    </h2>
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isErrorState ? 'text-red-400' : 'text-slate-400'}`}>
                      MODO: {priceMode === 'cash' ? 'CASH' : `SYNCHRONY ${syncTerm}M`}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isErrorState ? 'bg-red-600' : 'bg-windmar-blue'}`}>
                    <span className="text-[10px] font-black text-white">
                      {totals.count}
                    </span>
                  </div>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {(Object.values(cart) as CartItem[]).length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 space-y-4"
                      >
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                          <Package size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Tu cotización está vacía.</p>
                          <p className="text-[10px] text-slate-300">Agrega productos para comenzar.</p>
                        </div>
                      </motion.div>
                    ) : (
                      (Object.values(cart) as CartItem[]).map(item => {
                        const product = PRODUCTS.find(p => p.id === item.id);
                        if (!product) return null;
                        const unitPrice = getUnitPrice(product);
                        
                        return (
                          <motion.div 
                            layout
                            key={item.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm space-y-2 hover:border-windmar-blue/30 transition-colors"
                          >
                            <div className="flex gap-3">
                              {product.image && (
                                <div className="w-12 h-12 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-100 p-1">
                                  <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="text-[11px] font-black text-slate-800 leading-tight flex-1 truncate">{product.name}</h4>
                                  <button 
                                    onClick={() => removeFromCart(item.id)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                
                                <div className="flex justify-between items-center mt-2">
                                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                    <button 
                                      onClick={() => updateQty(item.id, -1)}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-white hover:text-windmar-blue rounded-md transition-all text-slate-500"
                                    >
                                      <Minus size={10} />
                                    </button>
                                    <span className="w-6 text-center text-[10px] font-black text-slate-700 data-value">{item.qty}</span>
                                    <button 
                                      onClick={() => updateQty(item.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center hover:bg-white hover:text-windmar-blue rounded-md transition-all text-slate-500"
                                    >
                                      <Plus size={10} />
                                    </button>
                                  </div>
                                  <p className="text-xs font-black text-slate-900 data-value tracking-tight">
                                    {currencyFormatter.format(unitPrice * item.qty)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-5 bg-white border-t border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                      TOTAL A PAGAR
                    </span>
                    <motion.span 
                      key={priceMode === 'cash' ? totals.total : totals.totalFinanced}
                      initial={{ scale: 1.1, color: "#004a99" }}
                      animate={{ scale: 1, color: "#004a99" }}
                      className="text-3xl font-black tracking-tighter text-windmar-blue"
                    >
                      {currencyFormatter.format(priceMode === 'cash' ? totals.total : totals.totalFinanced)}
                    </motion.span>
                  </div>

                  {priceMode === 'sync' && (
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <RotateCcw size={10} className="text-windmar-orange" /> PRONTO (Down Payment)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input 
                            type="number"
                            value={downPayment || ''}
                            onChange={(e) => setDownPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="0.00"
                            className="w-full pl-7 pr-4 py-2 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-windmar-blue rounded-xl text-xs font-bold transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuota Mensual ({syncTerm}m)</span>
                        <span className="text-sm font-black text-windmar-orange tracking-tight">
                          {currencyFormatter.format(totals.total)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={resetCart}
                      className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Trash2 size={14} />
                      Vaciar
                    </button>
                    <button 
                      onClick={copySummary}
                      disabled={totals.lines === 0}
                      className="flex items-center justify-center gap-2 py-2.5 bg-blue-200 hover:bg-blue-300 text-blue-700 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Copy size={14} />
                      Copiar
                    </button>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Info size={12} className="shrink-0 text-slate-400 mt-0.5" />
                    <p className="text-[8px] text-slate-400 font-bold leading-tight uppercase tracking-wider">
                      Precios referenciales. Los planes de financiamiento están sujetos a aprobación de crédito. <b>Firma: Dilan Buitrago</b>
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className={`fixed bottom-10 left-1/2 -translate-x-1/2 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-900/90 border-red-500' : 'bg-slate-900/90 border-white/10'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                {toast.type === 'error' ? (
                  <Info className="text-red-400" size={20} />
                ) : (
                  <CheckCircle2 className="text-emerald-400" size={20} />
                )}
              </div>
              <span className="text-sm font-black uppercase tracking-widest">{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <footer className="max-w-7xl mx-auto px-4 py-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-4 text-slate-200">
            <div className="h-px w-12 bg-slate-200"></div>
            <Package size={20} className="text-slate-300" />
            <div className="h-px w-12 bg-slate-200"></div>
          </div>
          <div className="space-y-2">
            <div className="max-w-lg mx-auto space-y-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Herramienta de Apoyo para Ventas · Windmar Home Puerto Rico
              </p>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                © {new Date().getFullYear()} Windmar Home. Todos los derechos reservados. 
                Los precios mostrados son referenciales y pueden variar según la configuración final del sistema y promociones vigentes.
              </p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
                © Windmar Home - All Rights Reserved
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
