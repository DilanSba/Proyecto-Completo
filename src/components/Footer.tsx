import React from 'react';
import { ShieldCheck, CreditCard, Wrench } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <>
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-windmar-blue-light/30 dark:border-white/[0.08]">
        <div className="flex gap-4">
          <div className="bg-windmar-gold/10 p-3 rounded-xl h-fit">
            <ShieldCheck className="text-windmar-gold" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-[#e8eaed] text-sm mb-1">
              Garantía Integral
            </h4>
            <p className="text-slate-600 dark:text-[#a0a4ad] text-xs leading-relaxed">
              Roofing certificado · paneles solares de fabricante · baterías Tesla Powerwall con cobertura extendida opcional.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-windmar-blue/10 p-3 rounded-xl h-fit">
            <CreditCard className="text-windmar-blue" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-[#e8eaed] text-sm mb-1">
              Financiamiento Flexible
            </h4>
            <p className="text-slate-600 dark:text-[#a0a4ad] text-xs leading-relaxed">
              WH Financial · Oriental Bank · pago cash · descuentos VIP, cliente existente y bundles combinados.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-windmar-blue/10 p-3 rounded-xl h-fit">
            <Wrench className="text-windmar-blue" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-[#e8eaed] text-sm mb-1">
              Soporte Local
            </h4>
            <p className="text-slate-600 dark:text-[#a0a4ad] text-xs leading-relaxed">
              Línea Windmar Home · 787-395-7766 · Telemercadeo 811 · Ventas 839 · ventas@windmarhome.com.
            </p>
          </div>
        </div>
      </footer>

      <div className="text-center pt-8 pb-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-[#6b7280] uppercase tracking-[0.3em]">
          © 2026 Windmar Home · Todos los derechos reservados
        </p>
      </div>
    </>
  );
};
