import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle2 } from 'lucide-react';
import { isMadresAnnounceActive, isMadresSaleActive } from '../lib/promoMadres';

export type SealPlan = 'SILVER' | 'GOLD' | 'PLATINUM';
export type Idioma = 'es' | 'en';

export interface ConsultorInfo {
  nombre: string;
  correo: string;
  telefono: string;
}

export interface ClienteInfo {
  nombre: string;
  direccion: string;
  correo: string;
  telefono: string;
}

export interface PromoFlags {
  madresRoofing: boolean;
  madresSolar: boolean;
  farmaciasRoofing: boolean;
  farmaciasSolar: boolean;
}

export interface PromoSavings {
  madresRoofing: number;
  madresSolar: number;
  farmaciasRoofing: number;
  farmaciasSolar: number;
}

interface PDFModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  onClose: () => void;
  onConfirm: () => void;
  // Planes de sellado
  selectedSealPlans: SealPlan[];
  onSelectedSealPlansChange: (plans: SealPlan[]) => void;
  planRates: Record<SealPlan, number>;
  // Datos cliente/consultor (controlled desde App)
  consultor: ConsultorInfo;
  onConsultorChange: (c: ConsultorInfo) => void;
  cliente: ClienteInfo;
  onClienteChange: (c: ClienteInfo) => void;
  // Idioma del PDF (sincronizado con app)
  idioma: Idioma;
  onIdiomaChange: (i: Idioma) => void;
  // Promociones disponibles
  promos: PromoFlags;
  onPromosChange: (p: PromoFlags) => void;
  /** Ahorros calculados (informativos, para mostrar en cada card) */
  promoSavings: PromoSavings;
}

// ─── Tema (paleta Windmar Home) ──────────────────────────────────────────
const NAVY   = '#21274e';       // WH AZUL OSCURO
const BLUE   = '#1D429B';       // WH AZUL
const TEXT   = '#1e293b';       // negro azulado para títulos
const MUTED  = '#64748b';       // gris para labels y subtítulos
const CARD_BG       = '#f8fafc';        // gris muy claro para fondo de sección
const CARD_BORDER   = '#e2e8f0';        // borde sutil
const INPUT_BG      = '#ffffff';
const INPUT_BORDER  = '#cbd5e1';
const ACCENT_LINE   = '#1D429B';        // línea de sección — azul Windmar (no naranja)

// Helper de campo (fuera del componente para evitar remount por tecla)
function Field({
  label, value, onChange, type = 'text', colSpan = 1, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  colSpan?: 1 | 2;
  placeholder?: string;
}) {
  return (
    <div style={{ gridColumn: colSpan === 2 ? 'span 2' : 'span 1' }}>
      <label style={{
        display: 'block', fontSize: 11, color: MUTED, marginBottom: 5,
        fontWeight: 600, letterSpacing: 0.3,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', border: `1px solid ${INPUT_BORDER}`, borderRadius: 8,
          padding: '9px 11px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
          background: INPUT_BG, color: TEXT,
        }}
      />
    </div>
  );
}

const PLAN_COLORS: Record<SealPlan, { fg: string; bg: string; bgSoft: string }> = {
  SILVER:   { fg: '#475569', bg: '#94a3b8', bgSoft: '#f1f5f9' },
  GOLD:     { fg: '#92400e', bg: '#F89B24', bgSoft: '#fff7ed' },
  PLATINUM: { fg: '#1e293b', bg: NAVY,      bgSoft: '#e0e7ff' },
};

// Estilo de sección compartido
const sectionWrapStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 12,
  padding: 16,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 800, color: TEXT,
  textTransform: 'uppercase', letterSpacing: 0.8,
  borderBottom: `2px solid ${ACCENT_LINE}`,
  paddingBottom: 6, marginBottom: 14,
};

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function PDFModal({
  isOpen, isGenerating, onClose, onConfirm,
  selectedSealPlans, onSelectedSealPlansChange, planRates,
  consultor, onConsultorChange,
  cliente, onClienteChange,
  idioma, onIdiomaChange,
  promos, onPromosChange, promoSavings,
}: PDFModalProps) {
  const [error, setError] = useState('');
  const [promosOpen, setPromosOpen] = useState(true);

  const madresAnnounce = isMadresAnnounceActive();
  const madresApply    = isMadresSaleActive();

  const toggleSealPlan = (plan: SealPlan) => {
    onSelectedSealPlansChange(
      selectedSealPlans.includes(plan)
        ? selectedSealPlans.filter(p => p !== plan)
        : [...selectedSealPlans, plan],
    );
  };

  const handleConfirm = () => {
    if (selectedSealPlans.length === 0) {
      setError(idioma === 'en'
        ? 'Select at least one sealing plan.'
        : 'Selecciona al menos un plan de sellado.');
      return;
    }
    if (!consultor.nombre.trim() || !cliente.nombre.trim()) {
      setError(idioma === 'en'
        ? 'Customer name and consultant name are required.'
        : 'Nombre del cliente y consultor son requeridos.');
      return;
    }
    setError('');
    onConfirm();
  };

  if (!isOpen) return null;

  const isComparative = selectedSealPlans.length > 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }}>
      <div style={{
        background: '#f1f5f9', borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        border: `1px solid ${CARD_BORDER}`,
      }}>

        {/* Header — sin línea naranja */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', background: 'white',
          borderBottom: `1px solid ${CARD_BORDER}`,
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color={BLUE} />
            <span style={{ fontSize: 17, fontWeight: 800, color: TEXT }}>
              {idioma === 'en' ? 'Project Quote' : 'Cotización Proyecto'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', border: `1.5px solid ${BLUE}` }}>
              {(['es', 'en'] as const).map(lang => (
                <button key={lang} onClick={() => onIdiomaChange(lang)} style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: idioma === lang ? BLUE : 'white',
                  color:      idioma === lang ? 'white' : BLUE,
                  transition: 'all 0.15s',
                }}>
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={22} color="#94a3b8" />
            </button>
          </div>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* PLANES DE SELLADO — card propia */}
          <section style={sectionWrapStyle}>
            <div style={{
              ...sectionTitleStyle,
              display: 'flex', alignItems: 'baseline', gap: 8,
            }}>
              <span>{idioma === 'en' ? 'Sealing Plans' : 'Planes de Sellado'}</span>
              <span style={{ fontSize: 10, color: MUTED, fontWeight: 500, textTransform: 'none' }}>
                {idioma === 'en' ? '(select 1 or more)' : '(selecciona 1 o más)'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {(['SILVER', 'GOLD', 'PLATINUM'] as SealPlan[]).map(plan => {
                const isSelected = selectedSealPlans.includes(plan);
                const colors = PLAN_COLORS[plan];
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => toggleSealPlan(plan)}
                    style={{
                      position: 'relative',
                      padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${isSelected ? colors.bg : INPUT_BORDER}`,
                      background: isSelected ? colors.bg : INPUT_BG,
                      color: isSelected ? 'white' : TEXT,
                      fontWeight: 800, fontSize: 12, letterSpacing: 0.5,
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}
                  >
                    {isSelected && (
                      <CheckCircle2 size={13} style={{ position: 'absolute', top: 5, right: 5 }} />
                    )}
                    <span>{plan}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>
                      ${planRates[plan]}/sqft
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* PROMOCIONES DISPONIBLES — card propia, acordeón */}
          {madresAnnounce && (
            <section style={{
              ...sectionWrapStyle,
              background: 'linear-gradient(135deg, #fff5f9 0%, #f0fdf4 100%)',
              border: '1px solid #f5d0e2',
              padding: 0, overflow: 'hidden',
            }}>
              <button
                type="button"
                onClick={() => setPromosOpen(o => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', cursor: 'pointer', border: 'none',
                  background: 'transparent',
                  borderBottom: promosOpen ? '1px solid #f5d0e2' : 'none',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: TEXT, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  🎁 {idioma === 'en' ? 'Available promotions' : 'Promociones disponibles'}
                </span>
                <span style={{ fontSize: 10, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {promos.madresRoofing && (
                    <span style={{ background: '#E84F97', color: 'white', padding: '2px 6px', borderRadius: 8, fontWeight: 700, fontSize: 9 }}>
                      ♥ Roof
                    </span>
                  )}
                  {promos.madresSolar && (
                    <span style={{ background: '#E84F97', color: 'white', padding: '2px 6px', borderRadius: 8, fontWeight: 700, fontSize: 9 }}>
                      ♥ Solar
                    </span>
                  )}
                  {promos.farmaciasRoofing && (
                    <span style={{ background: '#0F9D58', color: 'white', padding: '2px 6px', borderRadius: 8, fontWeight: 700, fontSize: 9 }}>
                      ⚕ Farma-R
                    </span>
                  )}
                  {promos.farmaciasSolar && (
                    <span style={{ background: '#0F9D58', color: 'white', padding: '2px 6px', borderRadius: 8, fontWeight: 700, fontSize: 9 }}>
                      ⚕ Farma-S
                    </span>
                  )}
                  <span style={{ marginLeft: 4 }}>{promosOpen ? '▴' : '▾'}</span>
                </span>
              </button>

              {promosOpen && (
                <div style={{
                  padding: 14,
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10,
                }}>
                  {/* Promo card — Madres Roofing */}
                  <label style={{
                    cursor: madresApply ? 'pointer' : 'not-allowed',
                    opacity: madresApply ? 1 : 0.6,
                    padding: 12, borderRadius: 10,
                    border: `2px solid ${promos.madresRoofing && madresApply ? '#E84F97' : '#f5d0e2'}`,
                    background: promos.madresRoofing && madresApply ? '#fce7f0' : 'white',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={promos.madresRoofing}
                        disabled={!madresApply}
                        onChange={e => onPromosChange({ ...promos, madresRoofing: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#E84F97' }}
                      />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#BE2E71' }}>
                        🏠 ♥ {idioma === 'en' ? "Mother's — Roofing" : 'Madres — Roofing'}
                      </span>
                    </div>
                    <p style={{ fontSize: 10.5, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                      {idioma === 'en'
                        ? <>Platinum at Gold price <b>(~15% off Platinum)</b>.</>
                        : <>Platinum al precio de Gold <b>(~15% off Platinum)</b>.</>}
                    </p>
                    {promos.madresRoofing && madresApply && promoSavings.madresRoofing > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>
                        −{fmt(promoSavings.madresRoofing)}
                      </span>
                    )}
                  </label>

                  {/* Promo card — Madres Solar */}
                  <label style={{
                    cursor: madresApply ? 'pointer' : 'not-allowed',
                    opacity: madresApply ? 1 : 0.6,
                    padding: 12, borderRadius: 10,
                    border: `2px solid ${promos.madresSolar && madresApply ? '#E84F97' : '#f5d0e2'}`,
                    background: promos.madresSolar && madresApply ? '#fce7f0' : 'white',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={promos.madresSolar}
                        disabled={!madresApply}
                        onChange={e => onPromosChange({ ...promos, madresSolar: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#E84F97' }}
                      />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#BE2E71' }}>
                        ☀️ ♥ {idioma === 'en' ? "Mother's — Solar" : 'Madres — Solar'}
                      </span>
                    </div>
                    <p style={{ fontSize: 10.5, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                      {idioma === 'en'
                        ? <>4–5 kW: <b>$500</b> · 5 kW+: <b>$1,000</b>.</>
                        : <>4–5 kW: <b>$500</b> · 5 kW+: <b>$1,000</b>.</>}
                    </p>
                    {promos.madresSolar && madresApply && promoSavings.madresSolar > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>
                        −{fmt(promoSavings.madresSolar)}
                      </span>
                    )}
                  </label>

                  {/* Promo card — Farmacias Roofing */}
                  <label style={{
                    cursor: 'pointer', padding: 12, borderRadius: 10,
                    border: `2px solid ${promos.farmaciasRoofing ? '#0F9D58' : '#A7E5C4'}`,
                    background: promos.farmaciasRoofing ? '#dcfce7' : 'white',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={promos.farmaciasRoofing}
                        onChange={e => onPromosChange({ ...promos, farmaciasRoofing: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0F9D58' }}
                      />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F9D58' }}>
                        💊 ⚕ {idioma === 'en' ? 'Pharmacy — Roofing' : 'Farmacias — Roofing'}
                      </span>
                    </div>
                    <p style={{ fontSize: 10.5, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                      {idioma === 'en'
                        ? <><b>10% off</b> roofing total. Licensed pharmacy professionals.</>
                        : <><b>10% off</b> sobre roofing total. Profesionales licenciados.</>}
                    </p>
                    {promos.farmaciasRoofing && promoSavings.farmaciasRoofing > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>
                        −{fmt(promoSavings.farmaciasRoofing)}
                      </span>
                    )}
                  </label>

                  {/* Promo card — Farmacias Solar */}
                  <label style={{
                    cursor: 'pointer', padding: 12, borderRadius: 10,
                    border: `2px solid ${promos.farmaciasSolar ? '#0F9D58' : '#A7E5C4'}`,
                    background: promos.farmaciasSolar ? '#dcfce7' : 'white',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={promos.farmaciasSolar}
                        onChange={e => onPromosChange({ ...promos, farmaciasSolar: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0F9D58' }}
                      />
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F9D58' }}>
                        💊 ⚕ {idioma === 'en' ? 'Pharmacy — Solar' : 'Farmacias — Solar'}
                      </span>
                    </div>
                    <p style={{ fontSize: 10.5, color: MUTED, margin: 0, lineHeight: 1.4 }}>
                      {idioma === 'en'
                        ? <><b>10% off</b> on solar panels. Licensed pharmacy professionals.</>
                        : <><b>10% off</b> sobre paneles solares. Profesionales licenciados.</>}
                    </p>
                    {promos.farmaciasSolar && promoSavings.farmaciasSolar > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>
                        −{fmt(promoSavings.farmaciasSolar)}
                      </span>
                    )}
                  </label>
                </div>
              )}

              {!madresApply && madresAnnounce && (
                <p style={{ fontSize: 10.5, color: MUTED, fontStyle: 'italic', padding: '0 14px 12px', margin: 0 }}>
                  {idioma === 'en'
                    ? 'Mother\'s Day promos open May 7, 2026. Farmacias available year-round.'
                    : 'Promos de Madres abren el 7 de mayo de 2026. Farmacias disponible todo el año.'}
                </p>
              )}
            </section>
          )}

          {/* Cuando la ventana de Madres ya cerró pero Farmacias sigue disponible */}
          {!madresAnnounce && (
            <section style={sectionWrapStyle}>
              <div style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎁 {idioma === 'en' ? 'Promotions' : 'Promociones'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <label style={{
                  cursor: 'pointer', padding: 12, borderRadius: 10,
                  border: `2px solid ${promos.farmaciasRoofing ? '#0F9D58' : '#A7E5C4'}`,
                  background: promos.farmaciasRoofing ? '#dcfce7' : 'white',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={promos.farmaciasRoofing}
                      onChange={e => onPromosChange({ ...promos, farmaciasRoofing: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#0F9D58' }}
                    />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F9D58' }}>
                      💊 ⚕ {idioma === 'en' ? 'Pharmacy — Roofing' : 'Farmacias — Roofing'}
                    </span>
                  </div>
                  {promos.farmaciasRoofing && promoSavings.farmaciasRoofing > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>−{fmt(promoSavings.farmaciasRoofing)}</span>
                  )}
                </label>

                <label style={{
                  cursor: 'pointer', padding: 12, borderRadius: 10,
                  border: `2px solid ${promos.farmaciasSolar ? '#0F9D58' : '#A7E5C4'}`,
                  background: promos.farmaciasSolar ? '#dcfce7' : 'white',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={promos.farmaciasSolar}
                      onChange={e => onPromosChange({ ...promos, farmaciasSolar: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#0F9D58' }}
                    />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F9D58' }}>
                      💊 ⚕ {idioma === 'en' ? 'Pharmacy — Solar' : 'Farmacias — Solar'}
                    </span>
                  </div>
                  {promos.farmaciasSolar && promoSavings.farmaciasSolar > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981' }}>−{fmt(promoSavings.farmaciasSolar)}</span>
                  )}
                </label>
              </div>
            </section>
          )}

          {/* CLIENTE — card propia */}
          <section style={sectionWrapStyle}>
            <div style={sectionTitleStyle}>
              {idioma === 'en' ? 'Customer Information' : 'Datos del Cliente'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field
                label={idioma === 'en' ? 'Full name *' : 'Nombre completo *'}
                value={cliente.nombre}
                onChange={v => onClienteChange({ ...cliente, nombre: v })}
                colSpan={2}
                placeholder={idioma === 'en' ? 'e.g. María López' : 'Ej. María López'}
              />
              <Field
                label={idioma === 'en' ? 'Address' : 'Dirección'}
                value={cliente.direccion}
                onChange={v => onClienteChange({ ...cliente, direccion: v })}
                colSpan={2}
                placeholder={idioma === 'en' ? 'Street, City, PR 00000' : 'Calle, Ciudad, PR 00000'}
              />
              <Field
                label={idioma === 'en' ? 'Phone' : 'Teléfono'}
                value={cliente.telefono}
                onChange={v => onClienteChange({ ...cliente, telefono: v })}
                type="tel"
                placeholder="787-000-0000"
              />
              <Field
                label="Email"
                value={cliente.correo}
                onChange={v => onClienteChange({ ...cliente, correo: v })}
                type="email"
                placeholder="cliente@email.com"
              />
            </div>
          </section>

          {/* CONSULTOR — card propia */}
          <section style={sectionWrapStyle}>
            <div style={sectionTitleStyle}>
              {idioma === 'en' ? 'Consultant Information' : 'Datos del Consultor'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field
                label={idioma === 'en' ? 'Consultant name *' : 'Nombre del Consultor *'}
                value={consultor.nombre}
                onChange={v => onConsultorChange({ ...consultor, nombre: v })}
                colSpan={2}
                placeholder={idioma === 'en' ? 'e.g. Juan García' : 'Ej. Juan García'}
              />
              <Field
                label="Email"
                value={consultor.correo}
                onChange={v => onConsultorChange({ ...consultor, correo: v })}
                type="email"
                placeholder="consultor@windmarhome.com"
              />
              <Field
                label={idioma === 'en' ? 'Phone' : 'Teléfono'}
                value={consultor.telefono}
                onChange={v => onConsultorChange({ ...consultor, telefono: v })}
                type="tel"
                placeholder="787-000-0000"
              />
            </div>
          </section>

          {error && (
            <p style={{
              fontSize: 12, color: '#b91c1c',
              background: '#fee2e2', padding: '10px 14px', borderRadius: 8,
              border: '1px solid #fca5a5',
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer — fondo blanco con line top */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 22px', background: 'white',
          borderTop: `1px solid ${CARD_BORDER}`,
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }}>
          <button
            onClick={onClose}
            disabled={isGenerating}
            style={{
              padding: '10px 20px', borderRadius: 8,
              border: `1px solid ${INPUT_BORDER}`,
              background: 'white', color: MUTED, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            }}
          >
            {idioma === 'en' ? 'Cancel' : 'Cancelar'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isGenerating}
            style={{
              padding: '10px 22px', borderRadius: 8, border: 'none',
              background: isGenerating ? '#94a3b8' : BLUE,
              color: 'white', fontSize: 12, fontWeight: 800,
              cursor: isGenerating ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: `0 4px 12px ${BLUE}33`,
              textTransform: 'uppercase', letterSpacing: 0.6,
            }}
          >
            <Download size={15} />
            {isGenerating
              ? (idioma === 'en' ? 'Generating…' : 'Generando…')
              : isComparative
                ? (idioma === 'en' ? 'Generate Comparison PDF' : 'Generar Comparativa PDF')
                : (idioma === 'en' ? 'Download PDF' : 'Descargar PDF')}
          </button>
        </div>
      </div>
    </div>
  );
}
