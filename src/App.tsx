import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Battery,
  Home,
  Calculator,
  Percent,
  ShieldCheck,
  Trash2,
  ChevronRight,
  Info,
  DollarSign,
  Zap,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  Phone,
  Moon,
  Download,
  X,
  User,
  Mail,
  MapPin
} from 'lucide-react';
import { QuoteInputs } from './types';
import { calculateQuote } from './utils/calculations';
import { PANEL_PRICES } from './constants';
import { generateQuotePDF, ConsultorInfo, ClienteInfo } from './utils/pdfGenerator';

const LOGO_URL = "https://i.postimg.cc/44pJ0vXw/logo.png";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [consultor, setConsultor] = useState<ConsultorInfo>({ nombre: '', correo: '', telefono: '' });
  const [cliente, setCliente] = useState<ClienteInfo>({ nombre: '', direccion: '', correo: '', telefono: '' });
  const [inputs, setInputs] = useState<QuoteInputs>({
    roofPlan: 'SILVER',
    roofSqft: 0,
    panels: 0,
    batteries: 0,
    removal: false,
    vipDiscount: false,
    existingSolarCustomer: false,
    roofCashDiscount: false,
    extendedWarranty: false,
    financing: 'WH',
    manualPronto: 0,
    removalPercentage: 0,
    applyOrientalSpecialDiscount: false,
    employeeDiscountKey: 'Ninguno',
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => calculateQuote(inputs), [inputs]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatNumber = (val: number) => 
    new Intl.NumberFormat('en-US').format(val);

  const formatPercent = (val: number) => 
    `${(val * 100).toFixed(1)}%`;

  const updateInput = (key: keyof QuoteInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await generateQuotePDF(inputs, results, consultor, cliente);
    } finally {
      setPdfLoading(false);
      setShowPdfModal(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-[#f1f5f9] text-slate-900'} font-sans selection:bg-blue-100 relative overflow-x-hidden`}>
      {/* High-Impact Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-400/10'} blur-[120px]`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full ${isDarkMode ? 'bg-indigo-900/20' : 'bg-blue-300/10'} blur-[120px]`} />
        <div className={`absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full ${isDarkMode ? 'bg-blue-800/10' : 'bg-blue-500/5'} blur-[100px]`} />
        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${isDarkMode ? 'opacity-[0.05] invert' : 'opacity-[0.02]'} mix-blend-multiply`} />
      </div>

      <div className="relative z-10">
        <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[100] bg-[#1e3a8a] flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Exploding Emojis (From Center) */}
            {[...Array(80)].map((_, i) => {
              const angle = Math.random() * Math.PI * 2;
              const distance = 400 + Math.random() * 800;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;
              
              return (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{ 
                    x: x, 
                    y: y, 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.2, 1.2, 0],
                    rotate: Math.random() * 720
                  }}
                  transition={{ 
                    duration: 2.5 + Math.random() * 1,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute select-none pointer-events-none"
                >
                  {i % 8 === 0 ? <DollarSign className="w-12 h-12 text-blue-300/30" /> : 
                   i % 8 === 1 ? <Sun className="w-12 h-12 text-yellow-400/30" /> :
                   i % 8 === 2 ? <Zap className="w-12 h-12 text-yellow-300/30" /> :
                   i % 8 === 3 ? <Battery className="w-12 h-12 text-green-400/30" /> :
                   i % 8 === 4 ? <Home className="w-12 h-12 text-blue-200/30" /> :
                   i % 8 === 5 ? <span className="text-4xl opacity-30">💰</span> : 
                   i % 8 === 6 ? <span className="text-4xl opacity-30">💸</span> :
                   <span className="text-4xl opacity-30">💵</span>}
                </motion.div>
              );
            })}

            {/* Waves from center */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 5, opacity: 0 }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
                className="absolute w-64 h-64 border-[3px] border-blue-300/30 rounded-full"
              />
            ))}

            <div className="flex flex-col items-center max-w-md w-full gap-20 relative z-10">
              <motion.div
                initial={{ y: -1000, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 20, opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 12, 
                  mass: 1,
                  duration: 1.5 
                }}
                className="relative"
              >
                <img 
                  src={LOGO_URL} 
                  alt="Windmar Home" 
                  className="w-56 md:w-72"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              <div className="flex justify-between w-full px-4 gap-8">
                {[
                  { icon: <Sun className="w-10 h-10" />, label: "Placas", delay: 0.4 },
                  { icon: <Home className="w-10 h-10" />, label: "Roofing", delay: 0.6 },
                  { icon: <Battery className="w-10 h-10" />, label: "Baterías", delay: 0.8 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay, duration: 0.8, type: "spring" }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-xl border border-white/10">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-100/80">{item.label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="w-full space-y-6">
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden border border-white/10 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: [0.65, 0, 0.35, 1] }}
                    className="h-full bg-gradient-to-r from-blue-400 to-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  />
                </div>
                <p className="text-[11px] font-black text-center text-blue-100/60 uppercase tracking-[0.5em]">
                  Sincronizando Cotización Pro
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 transition-all bg-transparent">
        <div className="max-w-[1600px] mx-auto px-6 pt-4 pb-1 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center"
            >
              <img src={LOGO_URL} alt="Windmar Home" className="h-16 md:h-24 transition-all" referrerPolicy="no-referrer" />
            </motion.div>
            
            <div className="flex flex-col items-center md:items-start">
              <h1 className={`text-lg md:text-xl lg:text-2xl font-black tracking-tighter ${isDarkMode ? 'text-blue-400' : 'text-[#1e3a8a]'} leading-none uppercase`}>
                WINDMAR PROYECTO COMPLETO
              </h1>
              <p className={`text-[10px] md:text-[12px] ${isDarkMode ? 'text-blue-300/80' : 'text-blue-500/80'} font-bold mt-1 tracking-tight`}>
                Roofing, Solar y Baterías de alta ingeniería
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-2xl border transition-all shadow-lg flex items-center gap-2 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 shadow-yellow-900/20' 
                  : 'bg-white border-slate-200 text-slate-600 shadow-blue-900/10'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
              </span>
            </motion.button>

            <div className="flex flex-col items-center md:items-end gap-0">
              <div className="flex items-center gap-2 text-[#f59e0b]">
                <Phone className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                <span className="text-lg md:text-xl font-black tracking-tight">787-395-7766</span>
              </div>
              <p className={`text-[9px] font-black ${isDarkMode ? 'text-blue-400' : 'text-[#1e3a8a]'} uppercase tracking-[0.15em]`}>LINEA WINDMAR HOME</p>
              <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                <span>TELEMERCADEO - 811</span>
                <span>VENTAS - 839</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 pb-6 pt-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:col-span-4 space-y-4"
        >
          <section className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-white/20'} backdrop-blur-md rounded-3xl border shadow-2xl shadow-black/20`}>
            <div className={`p-3 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-center`}>
              <div className={`flex ${isDarkMode ? 'bg-slate-950/50 border-slate-700' : 'bg-slate-200/50 border-slate-300'} p-1 rounded-xl border shadow-inner`}>
                <button 
                  onClick={() => updateInput('financing', 'WH')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${inputs.financing === 'WH' ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white text-blue-700 shadow-md') : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                >
                  WH Financial
                </button>
                <button 
                  onClick={() => updateInput('financing', 'ORIENTAL')}
                  className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${inputs.financing === 'ORIENTAL' ? (isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white text-blue-700 shadow-md') : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')}`}
                >
                  Oriental
                </button>
              </div>
            </div>
            <div className="p-4 space-y-6">
              {/* Roofing Section */}
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100/50'} rounded-lg border shadow-sm`}>
                  <h3 className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-widest flex items-center gap-2`}>
                    <Home className="w-3.5 h-3.5" />
                    DETALLES DE ROOFING 🏠
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ModernSelect 
                    label="Plan"
                    value={inputs.roofPlan}
                    onChange={(val) => updateInput('roofPlan', val)}
                    options={[
                      { value: 'SILVER', label: 'Silver' },
                      { value: 'GOLD', label: 'Gold' },
                      { value: 'PLATINUM', label: 'Platinum' }
                    ]}
                    isDarkMode={isDarkMode}
                  />
                  <InputGroup label="Área (sqft)" isDarkMode={isDarkMode}>
                    <input 
                      type="number"
                      value={inputs.roofSqft}
                      onChange={(e) => updateInput('roofSqft', Number(e.target.value))}
                      className={`w-full bg-transparent text-sm font-bold outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    />
                  </InputGroup>
                  <div className="sm:col-span-2">
                    <InputGroup label="% Área con Remoción" isDarkMode={isDarkMode}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={inputs.removalPercentage}
                          onChange={(e) => updateInput('removalPercentage', Number(e.target.value))}
                          className={`flex-1 h-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} rounded-lg appearance-none cursor-pointer accent-blue-600`}
                        />
                        <div className="flex items-center gap-1 min-w-[60px] justify-end">
                          <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{Math.round(inputs.removalPercentage * 100)}%</span>
                        </div>
                      </div>
                    </InputGroup>
                  </div>
                </div>
              </div>

              {/* Energy Section */}
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100/50'} rounded-lg border shadow-sm`}>
                  <h3 className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-widest flex items-center gap-2`}>
                    <Sun className="w-3.5 h-3.5" />
                    SISTEMA SOLAR ☀️
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <ModernSelect 
                      label="Placas"
                      value={inputs.panels}
                      onChange={(val) => updateInput('panels', Number(val))}
                      options={Object.keys(PANEL_PRICES).map(k => ({ value: Number(k), label: `${k} Placas` }))}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                  <div className="space-y-1">
                    <ModernSelect 
                      label="Baterías"
                      value={inputs.batteries}
                      onChange={(val) => updateInput('batteries', Number(val))}
                      options={[0, 1, 2, 3, 4].map(n => ({ value: n, label: `${n} Baterías` }))}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
                
                <Toggle 
                  label="Garantía Extendida" 
                  icon={<ShieldCheck className="w-4 h-4" />}
                  active={inputs.extendedWarranty} 
                  onClick={() => updateInput('extendedWarranty', !inputs.extendedWarranty)} 
                  isDarkMode={isDarkMode}
                />
                {(inputs.extendedWarranty) && (
                  <div className={`px-3 py-2 ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50/50 border-blue-100'} border rounded-xl`}>
                    <p className={`text-[9px] font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-tight leading-tight`}>
                      {inputs.panels > 0 && inputs.batteries === 0 && "Incluye: Cobertura Solar ($0.15/watt)"}
                      {inputs.panels === 0 && inputs.batteries > 0 && "Incluye: Cobertura Batería ($3,000 c/u)"}
                      {inputs.panels > 0 && inputs.batteries > 0 && "Incluye: Cobertura Solar + Batería"}
                      {inputs.panels === 0 && inputs.batteries === 0 && "Seleccione equipo para aplicar garantía"}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Section */}
              <div className="space-y-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100/50'} rounded-lg border shadow-sm`}>
                  <h3 className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-widest flex items-center gap-2`}>
                    <DollarSign className="w-3.5 h-3.5" />
                    AJUSTES FINANCIEROS 💰
                  </h3>
                </div>
                <InputGroup label="Pronto Adicional ($)" isDarkMode={isDarkMode}>
                  <input 
                    type="number"
                    value={inputs.manualPronto}
                    onChange={(e) => updateInput('manualPronto', Number(e.target.value))}
                    className={`w-full bg-transparent text-sm font-bold outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                    placeholder="0.00"
                  />
                </InputGroup>

                <ModernSelect 
                  label="Descuento Empleado"
                  value={inputs.employeeDiscountKey}
                  onChange={(val) => updateInput('employeeDiscountKey', val)}
                  options={[
                    { value: 'Ninguno', label: 'Ninguno' },
                    { value: 'Consultor (10%)', label: 'Consultor (10%)', group: 'Ventas' },
                    { value: 'Líder (15%)', label: 'Líder (15%)', group: 'Ventas' },
                    { value: 'Gerente (20%)', label: 'Gerente (20%)', group: 'Ventas' },
                    { value: 'Empleado (10%)', label: 'Empleado (10%)', group: 'Admin/Operaciones' },
                    { value: 'Gerencial (15%)', label: 'Gerencial (15%)', group: 'Admin/Operaciones' },
                    { value: 'Ejecutivo (20%)', label: 'Ejecutivo (20%)', group: 'Admin/Operaciones' }
                  ]}
                  isDarkMode={isDarkMode}
                />

                <AnimatePresence>
                  {inputs.financing === 'ORIENTAL' && inputs.panels >= 39 && inputs.batteries >= 3 && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`space-y-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-blue-100'} overflow-hidden`}
                    >
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-amber-900/30 border-amber-800' : 'bg-amber-50 border-amber-100/50'} rounded-lg border shadow-sm`}>
                        <h3 className={`text-[10px] font-black ${isDarkMode ? 'text-amber-400' : 'text-amber-700'} uppercase tracking-widest flex items-center gap-2`}>
                          <Zap className="w-3.5 h-3.5" />
                          OFERTA ESPECIAL ORIENTAL ⚡
                        </h3>
                      </div>
                      <div className={`${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50/50 border-amber-200'} p-3 rounded-xl border space-y-3`}>
                        <p className={`text-[10px] font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-800'} uppercase tracking-tight`}>
                          Sistema califica para bono de $12,500
                        </p>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="orientalDiscount" 
                              checked={inputs.applyOrientalSpecialDiscount}
                              onChange={() => updateInput('applyOrientalSpecialDiscount', true)}
                              className="w-4 h-4 accent-amber-600"
                            />
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300 group-hover:text-amber-400' : 'text-slate-700 group-hover:text-amber-700'} transition-colors`}>Incluir Descuento ($12,500)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="radio" 
                              name="orientalDiscount" 
                              checked={!inputs.applyOrientalSpecialDiscount}
                              onChange={() => updateInput('applyOrientalSpecialDiscount', false)}
                              className="w-4 h-4 accent-slate-400"
                            />
                            <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300 group-hover:text-slate-100' : 'text-slate-700 group-hover:text-slate-900'} transition-colors`}>No incluir</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <Toggle 
                  label="Cliente VIP (5%)" 
                  icon={<Percent className="w-4 h-4" />}
                  active={inputs.vipDiscount} 
                  onClick={() => updateInput('vipDiscount', !inputs.vipDiscount)} 
                  isDarkMode={isDarkMode}
                />
                <Toggle 
                  label="Cliente existente de solar" 
                  icon={<Sun className="w-4 h-4" />}
                  active={inputs.existingSolarCustomer} 
                  onClick={() => updateInput('existingSolarCustomer', !inputs.existingSolarCustomer)} 
                  isDarkMode={isDarkMode}
                />
                <Toggle 
                  label="Pago Cash Roofing" 
                  icon={<DollarSign className="w-4 h-4" />}
                  active={inputs.roofCashDiscount} 
                  onClick={() => updateInput('roofCashDiscount', !inputs.roofCashDiscount)} 
                  isDarkMode={isDarkMode}
                />
                </div>
            </div>
          </section>
        </motion.div>

        {/* Right Column: Results */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="lg:col-span-8 space-y-6"
        >
          {/* Compliance Check Bar */}
          <section className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-white/20'} backdrop-blur-md rounded-3xl border shadow-2xl shadow-black/20 p-4 shadow-xl shadow-blue-900/5`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-4">
              <div className="space-y-1">
                <div className={`inline-flex items-center gap-2 px-2 py-0.5 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'} rounded-md border`}>
                  <h2 className={`text-[8px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>VERIFICACIÓN ✅</h2>
                </div>
                <h3 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Viabilidad del Proyecto</h3>
              </div>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-center shadow-sm border ${results.conditionOk ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200') : (isDarkMode ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200')}`}>
                {results.conditionOk ? '✅ VIABLE' : '❌ NO ELEGIBLE'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Roofing Share</span>
                  <span className={`text-base font-black ${results.conditionOk ? 'text-emerald-600' : 'text-red-600'}`}>{formatPercent(results.roofShare)}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Límite</span>
                  <span className={`text-base font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{formatPercent(results.roofLimit)}</span>
                </div>
              </div>
              
              <div className={`h-3 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} rounded-full overflow-hidden p-0.5 border shadow-inner`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(results.roofShare / results.roofLimit * 100, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-1000 ${results.conditionOk ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
              </div>

              <p className={`text-[11px] font-bold text-center uppercase tracking-wider ${results.conditionOk ? 'text-emerald-700' : 'text-red-700'}`}>
                {results.conditionOk 
                  ? `✅ Roofing: ${formatPercent(results.roofShare)} de inversión (Límite: ${formatPercent(results.roofLimit)}) - PROYECTO ELEGIBLE`
                  : `❌ Roofing: ${formatPercent(results.roofShare)} de inversión (Excede Límite: ${formatPercent(results.roofLimit)}) - REQUIERE AJUSTE`}
              </p>
              
              {!results.conditionOk && results.requiredProntoForCompliance > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 ${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'} rounded-lg flex items-start gap-2.5 shadow-sm`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className={`text-[9px] font-black ${isDarkMode ? 'text-amber-400' : 'text-amber-900'} uppercase tracking-widest`}>Solución: Pronto Sugerido</p>
                    <p className={`text-[11px] ${isDarkMode ? 'text-amber-300' : 'text-amber-800'} mt-0.5 font-medium leading-tight`}>
                      Para elegibilidad, aportar pronto de <span className={`font-black ${isDarkMode ? 'text-amber-200' : 'text-amber-900'}`}>{formatCurrency(results.requiredProntoForCompliance)}</span>.
                    </p>
                    <button 
                      onClick={() => updateInput('manualPronto', Math.ceil(results.requiredProntoForCompliance))}
                      className="mt-2 px-3 py-1 bg-amber-600 text-white rounded-md text-[9px] font-black uppercase tracking-wider hover:bg-amber-700 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      Aplicar <CheckCircle2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* Payments */}
          <section className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-white/20'} backdrop-blur-md rounded-3xl border shadow-2xl shadow-black/20 overflow-hidden`}>
            <div className={`p-3 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-between`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100/50'} rounded-lg border shadow-sm`}>
                <h2 className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-widest`}>PAGOS MENSUALES 💳</h2>
              </div>
              <div className={`text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>
                Financiamiento: <span className="text-blue-600">{inputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank'}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {results.monthlyPayments.map((pay, idx) => (
                    <motion.div
                      key={`${pay.years}-${pay.label}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`${isDarkMode ? 'bg-slate-900 hover:bg-blue-900/40 border-slate-800 hover:border-blue-800' : 'bg-white hover:bg-blue-600 border-slate-100 hover:border-blue-500'} rounded-xl p-3 transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(37,99,235,0.06)] hover:shadow-blue-400/20 group relative overflow-hidden`}
                    >
                      <div className="relative z-10 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className={`w-7 h-7 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} group-hover:bg-white/20 rounded-lg flex items-center justify-center`}>
                            <span className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} group-hover:text-white`}>{pay.years}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-300 group-hover:text-blue-200 uppercase tracking-widest">Años</p>
                        </div>
                        
                        <div>
                          <p className="text-[9px] font-black text-slate-400 group-hover:text-blue-200 uppercase tracking-widest mb-0.5">{pay.label || 'Estándar'}</p>
                          <div className="flex flex-col">
                            <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} group-hover:text-white tracking-tighter leading-tight`}>
                              {formatCurrency(pay.amount)}
                            </p>
                            {pay.maxAmount && (
                              <p className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} group-hover:text-white tracking-tighter leading-tight`}>
                                {formatCurrency(pay.maxAmount)}
                              </p>
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 group-hover:text-blue-100">Pago Mensual</p>
                        </div>

                        <div className={`pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-50'} group-hover:border-white/10 flex justify-between items-center`}>
                          <span className="text-[9px] font-black text-slate-300 group-hover:text-blue-300 uppercase">APR</span>
                          <span className={`text-[11px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} group-hover:text-white`}>
                            {pay.maxRate ? `${(pay.rate * 100).toFixed(2)}% - ${(pay.maxRate * 100).toFixed(2)}%` : `${(pay.rate * 100).toFixed(2)}%`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Breakdown */}
          <div className="flex flex-col gap-6">
            <section className={`${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-white/20'} backdrop-blur-md rounded-3xl border shadow-2xl shadow-black/20 overflow-hidden`}>
              <div className={`p-3 border-b ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-between`}>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100/50'} rounded-lg border shadow-sm`}>
                  <h2 className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-widest`}>RESUMEN TOTAL DEL PROYECTO 📋</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPdfModal(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white' : 'bg-[#1e3a8a] hover:bg-blue-800 border-blue-900 text-white'}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar PDF
                </motion.button>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center">
                  <div className={`text-[8px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest pb-1 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>Concepto</div>
                  <div className={`text-[8px] font-black ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-widest pb-1 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} text-right`}>Precio</div>

                  <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>🏠 Valor Base Roofing</span>
                  <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-right`}>{formatCurrency(results.roofBaseValue)}</span>
                  
                  {results.roofRemovalValue > 0 && (
                    <>
                      <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>🧹 Remoción de Sellado</span>
                      <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-right`}>{formatCurrency(results.roofRemovalValue)}</span>
                    </>
                  )}

                  {inputs.roofCashDiscount && (
                    <>
                      <span className="text-[11px] text-slate-500">💵 Descuento Pago Cash (10%)</span>
                      <span className="text-[11px] font-bold text-blue-600 text-right">-{formatCurrency(results.roofCashDiscountValue)}</span>
                    </>
                  )}
                  
                  <span className="text-[11px] text-slate-500">📄 IVU (Exento - Proy. Completo)</span>
                  <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-right`}>{formatCurrency(results.roofIvu)}</span>
                  
                  {inputs.existingSolarCustomer && (
                    <>
                      <span className="text-[11px] text-slate-500">🎁 Descuento Cliente Solar</span>
                      <span className="text-[11px] font-bold text-blue-600 text-right">-{formatCurrency(results.vipRoofingDiscount)}</span>
                    </>
                  )}

                  <div className={`col-span-2 my-0.5 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`} />
                  
                  <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>☀️ Placas Solares ({(results.systemSize / 1000).toFixed(2)} kW)</span>
                  <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-right`}>{formatCurrency(results.solarValue)}</span>
                  
                  {results.batteryValue > 0 && (
                    <>
                      <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>🔋 Baterías de Respaldo</span>
                      <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-right`}>{formatCurrency(results.batteryValue)}</span>
                    </>
                  )}
                  
                  <span className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>🛡️ Garantías Extendidas</span>
                  <span className={`text-[11px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} text-right`}>{formatCurrency(results.solarWarrantyValue + results.batteryWarrantyValue)}</span>

                  {inputs.vipDiscount && (
                    <>
                      <span className="text-[11px] text-emerald-600 font-bold">✨ Descuento VIP (5%)</span>
                      <span className="text-[11px] font-bold text-emerald-600 text-right">-{formatCurrency(results.vipProjectDiscount)}</span>
                    </>
                  )}

                  {results.employeeDiscountValue > 0 && (
                    <>
                      <span className="text-[11px] text-blue-600 font-bold">🏢 Descuento Empleado ({inputs.employeeDiscountKey})</span>
                      <span className="text-[11px] font-bold text-blue-600 text-right">-{formatCurrency(results.employeeDiscountValue)}</span>
                    </>
                  )}

                  <div className={`col-span-2 mt-2 pt-2 border-t-2 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'} space-y-1`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>VALOR CASH TOTAL 💎</span>
                      <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(results.cashValue)}</span>
                    </div>

                    {inputs.manualPronto > 0 && (
                      <div className="flex justify-between items-center">
                        <span className={`text-[9px] font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest`}>PRONTO APORTADO 💵</span>
                        <span className="text-xs font-black text-slate-500">-{formatCurrency(inputs.manualPronto)}</span>
                      </div>
                    )}

                    <div className={`mt-1 pt-2 border-t ${isDarkMode ? 'border-blue-900/50' : 'border-blue-100'} flex items-center justify-between`}>
                      <span className={`text-[10px] font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} uppercase tracking-widest`}>BALANCE A FINANCIAR 💳</span>
                      <span className={`text-sm font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{formatCurrency(results.valorFinanciado)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={`max-w-[1600px] mx-auto px-6 py-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]`}>
        <div className="flex items-center gap-4">
          <img src={LOGO_URL} alt="Windmar Home" className={`h-5 grayscale opacity-50 ${isDarkMode ? 'invert' : ''}`} referrerPolicy="no-referrer" />
          <p>© 2026 Windmar Home Support. Todos los derechos reservados.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Estado del Sistema: Operacional
        </div>
      </footer>
      </div>

      {/* PDF Modal */}
      <AnimatePresence>
        {showPdfModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPdfModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="bg-[#1e3a8a] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Download className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Descargar Cotización PDF</h2>
                    <p className="text-[10px] text-blue-200 mt-0.5">Complete la información antes de generar el documento</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-3">
                  <div className={`flex items-center gap-2 pb-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`w-6 h-6 rounded-lg ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'} flex items-center justify-center`}>
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-[#1e3a8a]'}`}>Consultor</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <PdfInputField
                      label="Nombre completo"
                      value={consultor.nombre}
                      onChange={v => setConsultor(p => ({ ...p, nombre: v }))}
                      placeholder="Ej. Juan García"
                      isDarkMode={isDarkMode}
                    />
                    <PdfInputField
                      label="Correo electrónico"
                      value={consultor.correo}
                      onChange={v => setConsultor(p => ({ ...p, correo: v }))}
                      placeholder="consultor@windmarhome.com"
                      type="email"
                      isDarkMode={isDarkMode}
                    />
                    <PdfInputField
                      label="Teléfono"
                      value={consultor.telefono}
                      onChange={v => setConsultor(p => ({ ...p, telefono: v }))}
                      placeholder="787-000-0000"
                      type="tel"
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`flex items-center gap-2 pb-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div className={`w-6 h-6 rounded-lg ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'} flex items-center justify-center`}>
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-[#1e3a8a]'}`}>Cliente</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <PdfInputField
                      label="Nombre completo"
                      value={cliente.nombre}
                      onChange={v => setCliente(p => ({ ...p, nombre: v }))}
                      placeholder="Ej. María López"
                      isDarkMode={isDarkMode}
                    />
                    <PdfInputField
                      label="Dirección"
                      value={cliente.direccion}
                      onChange={v => setCliente(p => ({ ...p, direccion: v }))}
                      placeholder="Calle, Ciudad, PR 00000"
                      isDarkMode={isDarkMode}
                    />
                    <PdfInputField
                      label="Correo electrónico"
                      value={cliente.correo}
                      onChange={v => setCliente(p => ({ ...p, correo: v }))}
                      placeholder="cliente@email.com"
                      type="email"
                      isDarkMode={isDarkMode}
                    />
                    <PdfInputField
                      label="Teléfono"
                      value={cliente.telefono}
                      onChange={v => setCliente(p => ({ ...p, telefono: v }))}
                      placeholder="787-000-0000"
                      type="tel"
                      isDarkMode={isDarkMode}
                    />
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'} flex items-center justify-between gap-3`}>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${isDarkMode ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownloadPDF}
                  disabled={pdfLoading || !consultor.nombre || !cliente.nombre}
                  className="flex items-center gap-2.5 px-5 py-2 bg-[#1e3a8a] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/30"
                >
                  {pdfLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {pdfLoading ? 'Generando...' : 'Generar y Descargar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PdfInputField({ label, value, onChange, placeholder, type = 'text', isDarkMode }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  isDarkMode: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
          isDarkMode
            ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
            : 'bg-white border-slate-200 text-slate-900 placeholder-slate-300'
        }`}
      />
    </div>
  );
}

function SmallToggle({ label, subtext, active, onClick, isDarkMode }: { label: string, subtext: string, active: boolean, onClick: () => void, isDarkMode: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 mt-1 ml-1">
      <button 
        onClick={onClick}
        className="flex items-center gap-2 group cursor-pointer"
      >
        <div className={`w-6 h-3 rounded-full relative transition-colors ${active ? 'bg-blue-600' : (isDarkMode ? 'bg-slate-800' : 'bg-slate-200')}`}>
          <motion.div 
            animate={{ x: active ? 12 : 2 }}
            className="absolute top-0.5 w-2 h-2 bg-white rounded-full shadow-sm"
          />
        </div>
        <span className={`text-[8px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`}>{label}</span>
      </button>
      <p className={`text-[7px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'} uppercase tracking-tight ml-8 leading-none`}>{subtext}</p>
    </div>
  );
}

function InputGroup({ label, children, isDarkMode }: { label: string, children: React.ReactNode, isDarkMode: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className={`${isDarkMode ? 'bg-slate-950 border-slate-800 focus-within:border-blue-500' : 'bg-white border-slate-200 focus-within:border-blue-500'} border rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 transition-all`}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ModernSelect({ label, value, onChange, options, isDarkMode }: { 
  label: string, 
  value: any, 
  onChange: (val: any) => void, 
  options: { value: any, label: string, group?: string }[],
  isDarkMode: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groups = Array.from(new Set(options.map(o => o.group).filter(Boolean)));

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'} border ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : ''} rounded-2xl pl-4 pr-10 py-2.5 text-sm font-bold text-left outline-none cursor-pointer transition-all shadow-sm flex items-center justify-between group`}
        >
          <span className={`truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{selectedOption?.label || 'Seleccionar...'}</span>
          <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`absolute z-[100] w-full mt-2 ${isDarkMode ? 'bg-slate-900/95 border-slate-800 shadow-black' : 'bg-white/95 border-slate-100 shadow-blue-900/10'} backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden py-2 max-h-[300px] overflow-y-auto`}
            >
              {options.filter(o => !o.group).map((opt, idx) => (
                <button
                  key={`${opt.value}-${idx}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs font-bold transition-colors ${value === opt.value ? (isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-700') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600')}`}
                >
                  {opt.label}
                </button>
              ))}

              {groups.map(group => (
                <div key={group} className="mt-2">
                  <div className={`px-4 py-1 text-[9px] font-black ${isDarkMode ? 'text-slate-600 bg-slate-800/30' : 'text-slate-400 bg-slate-50/50'} uppercase tracking-widest`}>{group}</div>
                  {options.filter(o => o.group === group).map((opt, idx) => (
                    <button
                      key={`${opt.value}-${idx}`}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-6 py-2 text-left text-xs font-bold transition-colors ${value === opt.value ? (isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-700') : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-blue-400' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600')}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SelectGroup({ label, value, onChange, children, isDarkMode }: { label: string, value: any, onChange: (val: any) => void, children: React.ReactNode, isDarkMode: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="relative group"
      >
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'} border rounded-xl pl-3 pr-10 py-2 text-sm font-bold outline-none cursor-pointer appearance-none group-hover:border-blue-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm`}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-500 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-90" />
        </div>
      </motion.div>
    </div>
  );
}

function Toggle({ label, icon, active, onClick, isDarkMode }: { label: string, icon: React.ReactNode, active: boolean, onClick: () => void, isDarkMode: boolean }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${active ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-blue-600 border-blue-600 text-white shadow-sm') : (isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm')}`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`p-1 rounded-lg ${active ? 'bg-white/10' : (isDarkMode ? 'bg-slate-900' : 'bg-slate-50')}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-3.5 h-3.5' })}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className={`w-7 h-3.5 rounded-full relative transition-colors ${active ? 'bg-white/20' : (isDarkMode ? 'bg-slate-800' : 'bg-slate-100')}`}>
        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-transform ${active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </div>
    </motion.button>
  );
}

function StatCard({ label, value, subtext, icon, color, isDarkMode }: { label: string, value: string, subtext: string, icon: React.ReactNode, color: 'blue' | 'emerald' | 'gray', isDarkMode: boolean }) {
  const colors = {
    blue: isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:border-blue-900' : 'bg-white border-slate-200 text-slate-900 hover:border-blue-200',
    emerald: 'bg-emerald-600 border-emerald-600 text-white',
    gray: isDarkMode ? 'bg-slate-900/90 border-slate-800 text-white hover:border-slate-700' : 'bg-white/90 border-slate-200 text-slate-900 hover:border-slate-300'
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, y: -5 }}
      className={`${colors[color]} border rounded-3xl p-6 shadow-xl ${isDarkMode ? 'shadow-black/40' : 'shadow-slate-200/40'} flex flex-col justify-between min-h-[160px] cursor-default transition-all`}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${color === 'blue' ? (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600') : color === 'gray' ? (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600 shadow-sm') : 'bg-white/10 text-white'}`}>
          {icon}
        </div>
        <ChevronRight className="w-4 h-4 opacity-20" />
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${color === 'blue' ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : color === 'gray' ? (isDarkMode ? 'text-slate-500' : 'text-slate-400') : 'text-emerald-100'}`}>{label}</p>
        <p className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        <p className={`text-[10px] font-bold mt-1 ${color === 'blue' ? (isDarkMode ? 'text-slate-600' : 'text-slate-300') : color === 'gray' ? (isDarkMode ? 'text-slate-600' : 'text-slate-400/80') : 'text-emerald-200'}`}>{subtext}</p>
      </div>
    </motion.div>
  );
}

function DataRow({ label, value, highlight, muted, isDarkMode }: { label: string, value: string, highlight?: boolean, muted?: boolean, isDarkMode: boolean }) {
  return (
    <div className={`grid grid-cols-[1fr_auto] items-center py-0.5 gap-4 ${muted ? 'opacity-30' : ''}`}>
      <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-xs font-bold text-right ${highlight ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') : (isDarkMode ? 'text-slate-300' : 'text-slate-800')}`}>{value}</span>
    </div>
  );
}
