import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { QuoteInputs, QuoteResults } from '../types';
import { ROOF_PLAN_RATES } from '../constants';

export interface ConsultorInfo { nombre: string; correo: string; telefono: string; }
export interface ClienteInfo   { nombre: string; direccion: string; correo: string; telefono: string; }

export type Idioma = 'es' | 'en';

export interface PromoFlagsPDF {
  madresRoofing: boolean;
  madresSolar: boolean;
  farmaciasRoofing: boolean;
  farmaciasSolar: boolean;
}

// Helper translator
function makeTr(idioma: Idioma) {
  return (es: string, en: string): string => (idioma === 'en' ? en : es);
}

// ── Colores para banners promo ──────────────────────────────────────────────
const MADRES_PINK_BORDER: [number,number,number] = [232, 79, 151];   // #E84F97
const MADRES_PINK_BG:     [number,number,number] = [253, 233, 244];  // rosado pálido
const MADRES_PINK_TEXT:   [number,number,number] = [157, 23, 77];    // rosa oscuro

const FARM_GREEN_BORDER:  [number,number,number] = [15, 157, 88];    // #0F9D58
const FARM_GREEN_BG:      [number,number,number] = [220, 240, 226];  // verde pálido
const FARM_GREEN_TEXT:    [number,number,number] = [22, 101, 52];    // verde oscuro

// ── Paleta fija (igual en ambos modos) ───────────────────────────────────────
const ORANGE: [number,number,number] = [248, 155, 36 ]; // #F89B24
const NAVY:   [number,number,number] = [29,  66,  155]; // #1D429B
const LBLUE:  [number,number,number] = [166, 195, 230]; // #A6C3E6
const MGRAY:  [number,number,number] = [167, 169, 172]; // #A7A9AC
const WHITE:  [number,number,number] = [255, 255, 255];
const RED:    [number,number,number] = [220, 38,  38 ];
const AMBER:  [number,number,number] = [217, 119, 6  ];

// ── Paletas por modo ─────────────────────────────────────────────────────────
interface Theme {
  pageBg:      [number,number,number];
  sectionBg:   [number,number,number];
  textPrimary: [number,number,number];
  textLabel:   [number,number,number];
  rowAlt:      [number,number,number];
}

function getTheme(dark: boolean): Theme {
  if (dark) return {
    pageBg:      [33,  39,  78 ],  // #21274E
    sectionBg:   [45,  53,  97 ],  // #2D3561
    textPrimary: [255, 255, 255],  // blanco
    textLabel:   [167, 169, 172],  // #A7A9AC
    rowAlt:      [53,  64,  128],  // #354080
  };
  return {
    pageBg:      [244, 246, 250],  // #F4F6FA
    sectionBg:   [255, 255, 255],  // blanco
    textPrimary: [0,   0,   0  ],  // negro puro (per request)
    textLabel:   [60,  60,  60 ],  // gris oscuro casi negro para labels (no más azul)
    rowAlt:      [238, 241, 248],  // #EEF1F8
  };
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

interface LogoData { dataUrl: string; aspectRatio: number; }

// ── Carga logo, elimina fondo negro, submuestrea y devuelve aspect ratio real ─
async function loadLogo(url: string): Promise<LogoData | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload  = () => res();
      img.onerror = () => rej();
      img.src = url;
    });

    const aspectRatio = img.width / img.height;

    // Eliminar píxeles negros/muy oscuros
    const canvas = document.createElement('canvas');
    canvas.width  = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < d.data.length; i += 4) {
      if (d.data[i] < 60 && d.data[i+1] < 60 && d.data[i+2] < 60) d.data[i+3] = 0;
    }
    ctx.putImageData(d, 0, 0);

    // Submuestrear a 320×160px máx para buena calidad sin sobre-peso
    const MAX_W = 320, MAX_H = 160;
    const ratio = Math.min(MAX_W / canvas.width, MAX_H / canvas.height, 1);
    if (ratio < 1) {
      const out = document.createElement('canvas');
      out.width  = Math.round(canvas.width  * ratio);
      out.height = Math.round(canvas.height * ratio);
      out.getContext('2d')!.drawImage(canvas, 0, 0, out.width, out.height);
      return { dataUrl: out.toDataURL('image/png'), aspectRatio };
    }
    return { dataUrl: canvas.toDataURL('image/png'), aspectRatio };
  } catch { return null; }
}

export async function generateQuotePDF(
  inputs:     QuoteInputs,
  results:    QuoteResults,
  consultor:  ConsultorInfo,
  cliente:    ClienteInfo,
  isDarkMode  = false,
  idioma:     Idioma = 'es',
  promos?:    PromoFlagsPDF,
): Promise<void> {

  const tr = makeTr(idioma);
  const T   = getTheme(isDarkMode);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW  = doc.internal.pageSize.getWidth();   // 215.9 mm
  const PH  = doc.internal.pageSize.getHeight();  // 279.4 mm
  const M   = 12;
  const CW  = PW - M * 2;
  const date = new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-PR', { day: '2-digit', month: 'long', year: 'numeric' });

  const logoData = await loadLogo('https://i.postimg.cc/RF76rLv3/logo.png');

  // ── Fondo completo ───────────────────────────────────────────────────────
  doc.setFillColor(...T.pageBg);
  doc.rect(0, 0, PW, PH, 'F');

  // ── HEADER estilo loan/lease (navy + acento naranja + 3 zonas) ───────────
  const HEADER_H = 22;  // altura header navy en mm
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, HEADER_H, 'F');

  // Acento naranja: strip 2mm debajo del header navy
  doc.setFillColor(...ORANGE);
  doc.rect(0, HEADER_H, PW, 2, 'F');

  // Acento naranja: stripe vertical 1.5mm a la izquierda
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 1.5, HEADER_H, 'F');

  // Logo Windmar — pill blanco para que destaque sobre navy
  if (logoData) {
    const logoH = 14;
    const logoW = logoH * logoData.aspectRatio;
    const logoY = (HEADER_H - logoH) / 2;
    // Pill blanco background
    doc.setFillColor(...WHITE);
    doc.roundedRect(M - 1, logoY - 1, logoW + 2, logoH + 2, 1, 1, 'F');
    doc.addImage(logoData.dataUrl, 'PNG', M, logoY, logoW, logoH);
  } else {
    doc.setTextColor(...WHITE);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('WINDMAR HOME', M + 3, 13);
  }

  // Título center: "WINDMAR · PROYECTO COMPLETO"
  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('WINDMAR PROYECTO COMPLETO', 'WINDMAR COMPLETE PROJECT'), PW / 2, 10, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  // Antes en ORANGE — ahora LBLUE para reducir naranja, mantiene buen contraste sobre navy
  doc.setTextColor(...LBLUE);
  doc.text(
    tr('ROOFING · SOLAR · BATERÍAS DE ALTA INGENIERÍA',
       'ROOFING · SOLAR · HIGH-ENGINEERING BATTERIES'),
    PW / 2, 14.5, { align: 'center' }
  );

  // Header derecho: cotización + fecha
  const rx = PW - M;
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
  doc.text('787-395-7766', rx, 10, { align: 'right' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...LBLUE);
  doc.text(tr('Línea Windmar Home', 'Windmar Home Line'), rx, 14, { align: 'right' });
  doc.setFontSize(7); doc.setTextColor(...WHITE);
  doc.text(date, rx, 18.5, { align: 'right' });

  // Inicio del contenido
  let y = HEADER_H + 4;  // pequeño espacio bajo el acento naranja
  doc.setDrawColor(...LBLUE);
  doc.setLineWidth(0.3);
  doc.line(M, y, PW - M, y);
  y += 3;

  // ── Título ───────────────────────────────────────────────────────────────
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text(tr('COTIZACIÓN — PROYECTO COMPLETO', 'QUOTE — COMPLETE PROJECT'), M, y + 7);
  y += 9;
  // Antes en ORANGE — ahora NAVY para reducir naranja
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
  doc.text(tr('Roofing + Solar + Batería', 'Roofing + Solar + Battery'), M, y + 6);
  y += 9;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const HDR = 6.5;
  const RH  = 5.5;
  const DR  = 5;

  function cardHdr(x: number, cy: number, w: number, h: number, titleH: number,
                   titleBg: [number,number,number], title: string, border = false): void {
    doc.setFillColor(...T.sectionBg);
    doc.roundedRect(x, cy, w, h, 2, 2, 'F');
    if (border) { doc.setDrawColor(...ORANGE); doc.setLineWidth(0.35); doc.roundedRect(x, cy, w, h, 2, 2, 'S'); }
    doc.setFillColor(...titleBg);
    doc.roundedRect(x, cy, w, titleH, 2, 2, 'F');
    doc.rect(x, cy + titleH - 2, w, 2, 'F');
    if (border) { doc.setDrawColor(...ORANGE); doc.roundedRect(x, cy, w, titleH, 2, 2, 'S'); }
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(title, x + 4, cy + titleH - 1.8);
  }

  function labelVal(x: number, cy: number, w: number,
                    label: string, value: string, idx: number,
                    valColor: [number,number,number] = T.textPrimary): void {
    if (idx % 2 === 1) { doc.setFillColor(...T.rowAlt); doc.rect(x, cy, w, DR, 'F'); }
    doc.setFontSize(7.2); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
    doc.text(label + ':', x + 3, cy + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...valColor);
    doc.text(value, x + w - 3, cy + DR - 1.3, { align: 'right' });
  }

  // ── Consultor + Cliente ──────────────────────────────────────────────────
  const HALF = (CW - 4) / 2;
  const L_NAME = tr('Nombre', 'Name');
  const L_MAIL = tr('Correo', 'Email');
  const L_PHONE = tr('Teléfono', 'Phone');
  const L_ADDR = tr('Dirección', 'Address');
  const cRows:  [string,string][] = [[L_NAME, consultor.nombre], [L_MAIL, consultor.correo], [L_PHONE, consultor.telefono]];
  const clRows: [string,string][] = [[L_NAME, cliente.nombre], [L_ADDR, cliente.direccion], [L_MAIL, cliente.correo], [L_PHONE, cliente.telefono]];
  const maxIC = Math.max(cRows.length, clRows.length);

  cardHdr(M,        y, HALF, HDR + maxIC*RH, HDR, NAVY, tr('CONSULTOR', 'CONSULTANT'));
  cardHdr(M+HALF+4, y, HALF, HDR + maxIC*RH, HDR, NAVY, tr('CLIENTE', 'CUSTOMER'));

  for (let i = 0; i < maxIC; i++) {
    const ry = y + HDR + i * RH;
    if (i % 2 === 1) {
      doc.setFillColor(...T.rowAlt);
      doc.rect(M,        ry, HALF, RH, 'F');
      doc.rect(M+HALF+4, ry, HALF, RH, 'F');
    }
    const render = (x: number, w: number, lbl: string, val: string) => {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
      doc.text(lbl + ':', x + 3, ry + RH - 1.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textPrimary);
      doc.text(val || '—', x + w - 3, ry + RH - 1.5, { align: 'right' });
    };
    if (i < cRows.length)  render(M,        HALF, cRows[i][0],  cRows[i][1]);
    if (i < clRows.length) render(M+HALF+4, HALF, clRows[i][0], clRows[i][1]);
  }
  y += HDR + maxIC * RH + 4;

  // ── Resumen del Proyecto ─────────────────────────────────────────────────
  const NA = tr('No aplica', 'N/A');
  const BAT_SING = tr('Batería', 'Battery');
  const BAT_PLUR = tr('Baterías', 'Batteries');
  const PLACAS = tr('Placas', 'Panels');
  const sumRows: [string,string,string,string][] = [
    [tr('Plan Roofing', 'Roofing Plan'),   inputs.roofPlan,
     tr('Sistema Solar', 'Solar System'),  inputs.panels > 0 ? `${inputs.panels} ${PLACAS} · ${(results.systemSize/1000).toFixed(2)} kW` : NA],
    [tr('Área Total', 'Total Area'),     `${inputs.roofSqft.toLocaleString('en-US')} sqft`,
     BAT_PLUR,       inputs.batteries > 0 ? `${inputs.batteries} ${inputs.batteries===1?BAT_SING:BAT_PLUR}` : NA],
    [tr('Financiamiento', 'Financing'), inputs.financing==='WH'?'WH Financial':'Oriental Bank',
     tr('Valor Cash Total', 'Total Cash Value'), fmt(results.cashValue)],
    [tr('Pronto / Rebaja', 'Down / Rebate'), inputs.manualPronto>0?`-${fmt(inputs.manualPronto)}`:'—',
     tr('Balance a Financiar', 'Balance to Finance'), fmt(results.valorFinanciado)],
  ];
  const sumH = HDR + sumRows.length * DR;
  cardHdr(M, y, CW, sumH, HDR, ORANGE, tr('RESUMEN DEL PROYECTO', 'PROJECT SUMMARY'));
  const mid = M + CW / 2;
  sumRows.forEach(([l1, v1, l2, v2], i) => {
    const ry = y + HDR + i * DR;
    if (i % 2 === 1) { doc.setFillColor(...T.rowAlt); doc.rect(M, ry, CW, DR, 'F'); }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
    doc.text(l1 + ':', M + 3, ry + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textPrimary);
    doc.text(v1, mid - 4, ry + DR - 1.3, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
    doc.text(l2 + ':', mid + 4, ry + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textPrimary);
    doc.text(v2, M + CW - 3, ry + DR - 1.3, { align: 'right' });
  });
  y += sumH + 4;

  // ── Sistema seleccionado (3 columnas) ────────────────────────────────────
  const C3W = (CW - 6) / 3;

  const roofR: [string,string][] = [['Plan', inputs.roofPlan], [tr('Área', 'Area'), `${inputs.roofSqft.toLocaleString('en-US')} sqft`]];
  if (inputs.removalPercentage > 0) {
    roofR.push([tr('Área Remoción', 'Removal Area'), `${Math.round(inputs.removalPercentage*100)}%`]);
    roofR.push([tr('Costo Remoción', 'Removal Cost'), fmt(results.roofRemovalValue)]);
  }
  if (inputs.roofCashDiscount) roofR.push([tr('Desc. Cash', 'Cash Disc.'), '10%']);
  roofR.push([tr('Valor Base', 'Base Value'), fmt(results.roofBaseValue)]);

  const solR: [string,string][] = [];
  if (inputs.panels > 0) { solR.push([PLACAS, `${inputs.panels}`]); solR.push([tr('Potencia', 'Power'), `${(results.systemSize/1000).toFixed(2)} kW`]); }
  if (inputs.batteries > 0) solR.push([BAT_PLUR, `${inputs.batteries} ${inputs.batteries===1?BAT_SING:BAT_PLUR}`]);
  if (inputs.extendedWarranty) solR.push([tr('Garantía', 'Warranty'), tr('Incluida', 'Included')]);
  if (solR.length === 0) solR.push([tr('Sistema Solar', 'Solar System'), NA]);

  const finR: [string,string][] = [[tr('Entidad', 'Entity'), inputs.financing==='WH'?'WH Financial':'Oriental Bank']];
  if (inputs.vipDiscount) finR.push([tr('Desc. VIP', 'VIP Disc.'), '5%']);
  if (inputs.existingSolarCustomer) finR.push([tr('Cliente Solar', 'Solar Customer'), tr('Sí', 'Yes')]);
  if (inputs.employeeDiscountKey !== 'Ninguno') finR.push([tr('Desc. Empleado', 'Employee Disc.'), inputs.employeeDiscountKey]);
  if (inputs.applyOrientalSpecialDiscount && inputs.financing==='ORIENTAL') finR.push([tr('Bono Oriental', 'Oriental Bonus'), '-$12,500']);

  const maxC3 = Math.max(roofR.length, solR.length, finR.length);
  const c3H   = HDR + maxC3 * DR;

  const drawSys = (x: number, title: string, titleBg: [number,number,number], rows: [string,string][], border=false) => {
    cardHdr(x, y, C3W, c3H, HDR, titleBg, title, border);
    rows.forEach(([lbl, val], i) => { if (lbl) labelVal(x, y + HDR + i * DR, C3W, lbl, val, i); });
  };

  // En modo oscuro: FINANCIAMIENTO usa T.pageBg como fondo del header (efecto flotante + borde naranja)
  // En modo claro: usa NAVY para que el texto blanco sea legible
  const finTitleBg: [number,number,number] = isDarkMode ? T.pageBg : NAVY;

  drawSys(M,           'ROOFING',                                       NAVY,       roofR);
  drawSys(M+C3W+3,     tr('SOLAR & BATERÍAS', 'SOLAR & BATTERIES'),     ORANGE,     solR);
  drawSys(M+(C3W+3)*2, tr('FINANCIAMIENTO', 'FINANCING'),               finTitleBg, finR, true);
  y += c3H + 4;

  // ── Desglose + Opciones de Pago (2 columnas) ─────────────────────────────
  const LW = Math.round(CW * 0.56);
  const RW = CW - LW - 4;
  const LX = M;
  const RX = M + LW + 4;

  const pRows: [string,string,boolean?][] = [[tr('Valor Base Roofing', 'Roofing Base Value'), fmt(results.roofBaseValue)]];
  if (results.roofRemovalValue > 0)   pRows.push([tr('Remoción de Sellado', 'Sealing Removal'), fmt(results.roofRemovalValue)]);
  if (inputs.roofCashDiscount)        pRows.push([tr('Descuento Cash (10%)', 'Cash Discount (10%)'), `-${fmt(results.roofCashDiscountValue)}`, true]);
  pRows.push([tr('IVU (Exento)', 'Tax (Exempt)'), fmt(results.roofIvu)]);
  if (inputs.existingSolarCustomer)   pRows.push([tr('Desc. Cliente Solar', 'Solar Customer Disc.'), `-${fmt(results.vipRoofingDiscount)}`, true]);
  if (inputs.panels > 0)              pRows.push([`${PLACAS} (${(results.systemSize/1000).toFixed(2)} kW)`, fmt(results.solarValue)]);
  if (results.batteryValue > 0)       pRows.push([BAT_PLUR, fmt(results.batteryValue)]);
  if (results.solarWarrantyValue + results.batteryWarrantyValue > 0)
    pRows.push([tr('Garantías', 'Warranties'), fmt(results.solarWarrantyValue + results.batteryWarrantyValue)]);
  if (inputs.vipDiscount)             pRows.push([tr('Descuento VIP (5%)', 'VIP Discount (5%)'), `-${fmt(results.vipProjectDiscount)}`, true]);
  if (results.employeeDiscountValue > 0)
    pRows.push([tr('Desc. Empleado', 'Employee Disc.'), `-${fmt(results.employeeDiscountValue)}`, true]);
  // Promo Madres / Farmacias (si activas)
  if (promos?.madresRoofing && results.madresRoofingDiscountValue > 0)
    pRows.push([tr('Promo Madres 2026 (Roofing)', "Mother's 2026 (Roofing)"), `-${fmt(results.madresRoofingDiscountValue)}`, true]);
  if (promos?.madresSolar && results.madresSolarDiscountValue > 0)
    pRows.push([tr('Promo Madres 2026 (Solar)', "Mother's 2026 (Solar)"), `-${fmt(results.madresSolarDiscountValue)}`, true]);
  if (promos?.farmaciasRoofing && results.farmaciasRoofingDiscountValue > 0)
    pRows.push([tr('Promo Farmacias (Roofing, 10%)', 'Pharmacy Promo (Roofing, 10%)'), `-${fmt(results.farmaciasRoofingDiscountValue)}`, true]);
  if (promos?.farmaciasSolar && results.farmaciasSolarDiscountValue > 0)
    pRows.push([tr('Promo Farmacias (Solar, 10%)', 'Pharmacy Promo (Solar, 10%)'), `-${fmt(results.farmaciasSolarDiscountValue)}`, true]);

  const hasPronte = inputs.manualPronto > 0;
  const leftExtra = (hasPronte ? 9 : 0);
  const leftH = HDR + pRows.length * DR + 2 + 9 + leftExtra + 9.5;

  const hasRangePay = results.monthlyPayments.some(p => p.maxAmount);
  const PAY_H  = hasRangePay ? 10 : 6.5;
  const rightH = HDR + 7 + results.monthlyPayments.length * PAY_H + 12;
  const colH   = Math.max(leftH, rightH);

  // — Desglose (izquierda)
  cardHdr(LX, y, LW, colH, HDR, NAVY, tr('DESGLOSE DE PRECIOS', 'PRICE BREAKDOWN'));
  let ly = y + HDR;
  pRows.forEach(([lbl, val, isDisc], i) => {
    if (i%2===1) { doc.setFillColor(...T.rowAlt); doc.rect(LX, ly, LW, DR, 'F'); }
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
    doc.text(lbl, LX + 3, ly + DR - 1.3);
    doc.setFont('helvetica', 'normal');
    // Descuentos en rojo, valores normales en textPrimary
    doc.setTextColor(...(isDisc ? RED : T.textPrimary));
    doc.text(val, LX + LW - 3, ly + DR - 1.3, { align: 'right' });
    ly += DR;
  });
  // Línea separadora — antes naranja, ahora navy para reducir naranja
  doc.setDrawColor(...NAVY); doc.setLineWidth(0.5);
  doc.line(LX + 3, ly + 1, LX + LW - 3, ly + 1);
  ly += 3;
  // Valor Cash Total — antes ORANGE, ahora NAVY (negro fuerte, sin tanto naranja)
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
  doc.text(tr('VALOR CASH TOTAL', 'TOTAL CASH VALUE'), LX + 3, ly + 5.5);
  doc.text(fmt(results.cashValue), LX + LW - 3, ly + 5.5, { align: 'right' });
  ly += 8;
  if (hasPronte) {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textLabel);
    doc.text(tr('Pronto Aportado', 'Down Payment'), LX + 3, ly + 5.5);
    doc.text(`-${fmt(inputs.manualPronto)}`, LX + LW - 3, ly + 5.5, { align: 'right' });
    ly += 8;
  }
  // Balance a Financiar
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text(tr('BALANCE A FINANCIAR', 'BALANCE TO FINANCE'), LX + 3, ly + 5.5);
  doc.text(fmt(results.valorFinanciado), LX + LW - 3, ly + 5.5, { align: 'right' });

  // — Opciones de Pago (derecha)
  cardHdr(RX, y, RW, colH, HDR, ORANGE, tr('OPCIONES DE PAGO MENSUAL', 'MONTHLY PAYMENT OPTIONS'));
  let ry = y + HDR;
  // Cabecera de tabla
  doc.setFillColor(...NAVY);
  doc.rect(RX, ry, RW, 7, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
  const c1=RX+3, c2=RX+22, c3=RX+48;
  doc.text(tr('PLAZO', 'TERM'),                c1, ry + 5);
  doc.text('APR',                              c2, ry + 5);
  doc.text(tr('PAGO MENSUAL', 'MONTHLY PAY'),  c3, ry + 5);
  ry += 7;

  results.monthlyPayments.forEach((pay, idx) => {
    if (idx%2===1) { doc.setFillColor(...T.rowAlt); doc.rect(RX, ry, RW, PAY_H, 'F'); }
    const midY = ry + PAY_H / 2;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textLabel);
    doc.text(`${pay.years} ${tr('años', 'years')}`, c1, midY + 1.2);
    const aprTxt = pay.maxRate
      ? `${(pay.rate*100).toFixed(1)}-${(pay.maxRate*100).toFixed(1)}%`
      : `${(pay.rate*100).toFixed(2)}%`;
    doc.text(aprTxt, c2, midY + 1.2);
    // Monto mensual — antes ORANGE, ahora T.textPrimary (negro) bold para reducir naranja
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
    if (pay.maxAmount) {
      // Mostrar rango Desde / Hasta en dos líneas
      doc.setFontSize(6.5);
      doc.text(`${tr('Desde', 'From')}: ${fmt(pay.amount)}`,    c3, midY - 1.2);
      doc.setTextColor(...NAVY);
      doc.text(`${tr('Hasta', 'Up to')}: ${fmt(pay.maxAmount)}`, c3, midY + 3.2);
    } else {
      doc.setFontSize(7);
      doc.text(fmt(pay.amount), c3, midY + 1.2);
    }
    ry += PAY_H;
  });
  ry += 3;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text(tr('Balance a Financiar', 'Balance to Finance'), c1, ry + 5);
  // Valor del balance — antes ORANGE, ahora NAVY (más serio, sin saturar naranja)
  doc.setTextColor(...NAVY); doc.setFontSize(9);
  doc.text(fmt(results.valorFinanciado), RX + RW - 3, ry + 5, { align: 'right' });

  y += colH + 4;

  // ── Badge de elegibilidad — sin verde ────────────────────────────────────
  const badgeBg: [number,number,number] = isDarkMode ? [45, 53, 97] : [255, 255, 255];
  doc.setFillColor(...badgeBg);
  if (!isDarkMode) {
    doc.setDrawColor(...LBLUE); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 9.5, 2, 2, 'FD');
  } else {
    doc.roundedRect(M, y, CW, 9.5, 2, 2, 'F');
  }
  // Indicador de estado: cuadrado de color antes del texto
  const eligColor: [number,number,number] = results.conditionOk ? ORANGE : RED;
  doc.setFillColor(...eligColor);
  doc.rect(M + 3, y + 3.2, 3, 3, 'F');
  // Texto del badge (sin caracteres Unicode fuera de Latin-1)
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...eligColor);
  doc.text(
    results.conditionOk
      ? tr('PROYECTO ELEGIBLE', 'ELIGIBLE PROJECT')
      : tr('PROYECTO NO ELEGIBLE', 'NOT ELIGIBLE PROJECT'),
    M + 8, y + 6.5
  );
  // Roofing share a la derecha
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
  doc.text(
    `Roofing Share: ${(results.roofShare*100).toFixed(1)}%  |  ${tr('Límite', 'Limit')}: ${(results.roofLimit*100).toFixed(0)}%`,
    M + CW - 4, y + 6.5, { align: 'right' }
  );
  y += 9.5;

  if (!results.conditionOk && results.requiredProntoForCompliance > 0) {
    y += 3;
    doc.setFillColor(...AMBER);
    doc.roundedRect(M, y, CW, 7.5, 2, 2, 'F');
    doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(
      tr(
        `! Para elegibilidad se requiere pronto de: ${fmt(results.requiredProntoForCompliance)}`,
        `! Eligibility requires a down payment of: ${fmt(results.requiredProntoForCompliance)}`,
      ),
      PW/2, y + 5, { align: 'center' }
    );
    y += 7.5;
  }

  // ── BANNERS DE PROMOCIONES (Madres + Farmacias) ───────────────────────────
  const promoMadresActive    = !!(promos?.madresRoofing || promos?.madresSolar);
  const promoFarmaciasActive = !!(promos?.farmaciasRoofing || promos?.farmaciasSolar);

  if (promoMadresActive) {
    y += 3;
    const BANNER_H = 12;
    doc.setFillColor(...MADRES_PINK_BG);
    doc.setDrawColor(...MADRES_PINK_BORDER); doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, BANNER_H, 2, 2, 'FD');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MADRES_PINK_TEXT);
    doc.text(
      tr('♥ ♥ Promo Mes de las Madres 2026 ♥ ♥', "♥ ♥ Mother's Day Promo 2026 ♥ ♥"),
      PW/2, y + 4.5, { align: 'center' }
    );
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(
      tr(
        'Descuentos aplicados · Vigente del 7 al 14 de mayo 2026 · Solo en showroom con cliente citado',
        'Promo discounts applied · Valid May 7–14, 2026 · In-showroom only with scheduled customer',
      ),
      PW/2, y + 8.5, { align: 'center' }
    );
    doc.setFontSize(6.5);
    doc.text('Roosevelt · Mayagüez · Ponce · Hatillo', PW/2, y + 11.5, { align: 'center' });
    y += BANNER_H;
  }

  if (promoFarmaciasActive) {
    y += 3;
    const BANNER_H = 10;
    doc.setFillColor(...FARM_GREEN_BG);
    doc.setDrawColor(...FARM_GREEN_BORDER); doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, BANNER_H, 2, 2, 'FD');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...FARM_GREEN_TEXT);
    doc.text(
      tr('Promo Farmacias — 10% Descuento', 'Pharmacy Promo — 10% Off'),
      PW/2, y + 4.5, { align: 'center' }
    );
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(
      tr(
        'Aplica a profesionales licenciados de farmacia · Validación en showroom',
        'For licensed pharmacy professionals · In-showroom validation',
      ),
      PW/2, y + 8.5, { align: 'center' }
    );
    y += BANNER_H;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const FH = 19.4;
  // ── FOOTER estilo loan/lease (3 columnas) ────────────────────────────────
  const FOOTER_H = 22;
  const FY = PH - FOOTER_H;

  // Strip naranja arriba del footer
  doc.setFillColor(...ORANGE);
  doc.rect(0, FY - 1.5, PW, 1.5, 'F');
  // Stripe naranja vertical 1.5mm a la izquierda
  doc.setFillColor(...ORANGE);
  doc.rect(0, FY, 1.5, FOOTER_H, 'F');
  // Fondo navy
  doc.setFillColor(...NAVY);
  doc.rect(0, FY, PW, FOOTER_H, 'F');

  // Anchos de columna (descartando los 1.5mm del stripe izquierdo)
  const FOOT_M = 6;            // margen interno
  const C1_W = PW * 0.28;      // logo + brand
  const C2_W = PW * 0.36;      // contacto
  // const C3_W = PW * 0.36;   // dirección (resto)
  const C1_X = 1.5 + FOOT_M;
  const C2_X = C1_X + C1_W;
  const C3_X = C2_X + C2_W;

  // Columna 1: logo + brand
  if (logoData) {
    const lH = 10;
    const lW = lH * logoData.aspectRatio;
    doc.setFillColor(...WHITE);
    doc.roundedRect(C1_X - 1, FY + 4, lW + 2, lH + 2, 0.8, 0.8, 'F');
    doc.addImage(logoData.dataUrl, 'PNG', C1_X, FY + 5, lW, lH);
  }
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('WINDMAR HOME', C1_X, FY + 19);

  // Separador vertical 1-2
  doc.setDrawColor(140, 140, 170);
  doc.setLineWidth(0.2);
  doc.line(C2_X - 2, FY + 4, C2_X - 2, FY + FOOTER_H - 4);

  // Columna 2: contacto
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(tr('Contáctanos', 'Contact Us'), C2_X, FY + 7);
  doc.setTextColor(...LBLUE); doc.setFontSize(6.8); doc.setFont('helvetica', 'normal');
  doc.text('ventas@windmarhome.com', C2_X, FY + 12);
  doc.text(`787-395-7766 · ${tr('Línea Windmar Home', 'Windmar Home Line')}`, C2_X, FY + 16);
  doc.text(tr('Telemercadeo 811 · Ventas 839', 'Telemarketing 811 · Sales 839'), C2_X, FY + 20);

  // Separador vertical 2-3
  doc.setDrawColor(140, 140, 170);
  doc.setLineWidth(0.2);
  doc.line(C3_X - 2, FY + 4, C3_X - 2, FY + FOOTER_H - 4);

  // Columna 3: dirección
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text(tr('Dirección', 'Address'), C3_X, FY + 7);
  doc.setTextColor(...LBLUE); doc.setFontSize(6.8); doc.setFont('helvetica', 'normal');
  doc.text('1255 Avenida F.D. Roosevelt,', C3_X, FY + 12);
  doc.text('San Juan, 00920, Puerto Rico.', C3_X, FY + 16);
  doc.text(`${tr('Cotización', 'Quote')} · ${date}`, C3_X, FY + 20);

  // ── Merge: Pág 1 institucional → Cotización → Págs 2+ institucionales ────
  const clienteName = cliente.nombre.trim().replace(/\s+/g, '_') || 'Cliente';
  const today       = new Date().toLocaleDateString('es-PR').replace(/\//g, '-');
  const fileName    = `Cotizacion_Windmar_${clienteName}_${today}.pdf`;
  const quoteBytes  = doc.output('arraybuffer');

  try {
    const resp = await fetch('/ProyectoCompleto.pdf');
    if (!resp.ok) throw new Error('No se pudo cargar ProyectoCompleto.pdf');
    const proyectoBytes = await resp.arrayBuffer();

    const merged   = await PDFDocument.create();
    const quotePdf = await PDFDocument.load(quoteBytes);
    const instPdf  = await PDFDocument.load(proyectoBytes);

    const instPages = await merged.copyPages(instPdf, instPdf.getPageIndices());
    const [quotePg] = await merged.copyPages(quotePdf, [0]);

    if (instPages.length > 0) merged.addPage(instPages[0]);
    merged.addPage(quotePg);
    for (let i = 1; i < instPages.length; i++) merged.addPage(instPages[i]);

    const mergedBytes = await merged.save();
    const blob        = new Blob([mergedBytes], { type: 'application/pdf' });
    const url         = URL.createObjectURL(blob);
    const a           = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);

  } catch {
    doc.save(fileName);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison PDF — multiple sealing plans side by side on one page
// ─────────────────────────────────────────────────────────────────────────────
export async function generateComparisonPDF(
  baseInputs:  QuoteInputs,
  plans:       ('SILVER' | 'GOLD' | 'PLATINUM')[],
  allResults:  QuoteResults[],
  consultor:   ConsultorInfo,
  cliente:     ClienteInfo,
  isDarkMode   = false,
  idioma:      Idioma = 'es',
  promos?:     PromoFlagsPDF,
): Promise<void> {

  const tr  = makeTr(idioma);
  const T   = getTheme(isDarkMode);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const M   = 12;
  const CW  = PW - M * 2;
  const date = new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-PR', { day: '2-digit', month: 'long', year: 'numeric' });
  const logoData = await loadLogo('https://i.postimg.cc/RF76rLv3/logo.png');

  const N = plans.length;

  const PLAN_COLORS: Record<string, [number,number,number]> = {
    SILVER:   [148, 163, 184],
    GOLD:     [202, 138,   4],
    PLATINUM: ORANGE,
  };

  // ── Background & orange bar ──────────────────────────────────────────────
  doc.setFillColor(...T.pageBg);
  doc.rect(0, 0, PW, PH, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, PW, 2.2, 'F');

  // ── Logo ────────────────────────────────────────────────────────────────
  if (logoData) {
    const logoH = Math.min(16, 22.3 * 0.72);
    const logoW = Math.min(60, logoH * logoData.aspectRatio);
    const logoY = 2.2 + (22.3 - logoH) / 2;
    doc.addImage(logoData.dataUrl, 'PNG', M, logoY, logoW, logoH);
  } else {
    doc.setTextColor(...WHITE); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('WINDMAR HOME', M, 14);
  }

  // ── Header right ────────────────────────────────────────────────────────
  const rx = PW - M;
  // Antes ORANGE — ahora NAVY (más serio, sin saturar naranja)
  doc.setFontSize(9);   doc.setFont('helvetica', 'bold');   doc.setTextColor(...NAVY);
  doc.text('787-395-7766', rx, 9.5,  { align: 'right' });
  doc.setFontSize(8);   doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
  doc.text(tr('Línea Windmar Home', 'Windmar Home Line'), rx, 14, { align: 'right' });
  doc.setFontSize(7.5); doc.setTextColor(...MGRAY);
  doc.text(tr('Roofing · Solar · Baterías de Alta Ingeniería', 'Roofing · Solar · High-Engineering Batteries'), rx, 17.5, { align: 'right' });
  doc.setFontSize(8);   doc.setTextColor(...NAVY);
  doc.text(date, rx, 21.5, { align: 'right' });

  // ── Separator ───────────────────────────────────────────────────────────
  let y = 24.5;
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.55);
  doc.line(M, y, PW - M, y);
  y += 3;

  // ── Title ───────────────────────────────────────────────────────────────
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text(tr('COMPARATIVA — PROYECTO COMPLETO', 'COMPARISON — COMPLETE PROJECT'), M, y + 7);
  y += 9;
  // Antes ORANGE — ahora NAVY para reducir naranja
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NAVY);
  const planLabel = plans.map(p => p.charAt(0) + p.slice(1).toLowerCase()).join(' · ');
  doc.text(`${planLabel}  ·  ${tr('Roofing + Solar + Batería', 'Roofing + Solar + Battery')}`, M, y + 5.5);
  y += 8;

  // ── Layout constants ─────────────────────────────────────────────────────
  const HDR  = 6.5;
  const DR   = 5;
  const RH   = 5.5;
  const SUB_H = 4;

  // ── cardHdr helper ───────────────────────────────────────────────────────
  function cardHdr(x: number, cy: number, w: number, h: number, titleH: number,
                   titleBg: [number,number,number], title: string, border = false): void {
    doc.setFillColor(...T.sectionBg);
    doc.roundedRect(x, cy, w, h, 2, 2, 'F');
    if (border) { doc.setDrawColor(...ORANGE); doc.setLineWidth(0.35); doc.roundedRect(x, cy, w, h, 2, 2, 'S'); }
    doc.setFillColor(...titleBg);
    doc.roundedRect(x, cy, w, titleH, 2, 2, 'F');
    doc.rect(x, cy + titleH - 2, w, 2, 'F');
    if (border) { doc.setDrawColor(...ORANGE); doc.roundedRect(x, cy, w, titleH, 2, 2, 'S'); }
    doc.setTextColor(...WHITE); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(title, x + 4, cy + titleH - 1.8);
  }

  // ── Consultor + Cliente ──────────────────────────────────────────────────
  const HALF = (CW - 4) / 2;
  const L_NAME = tr('Nombre', 'Name');
  const L_MAIL = tr('Correo', 'Email');
  const L_PHONE = tr('Teléfono', 'Phone');
  const L_ADDR = tr('Dirección', 'Address');
  const cRows:  [string,string][] = [[L_NAME, consultor.nombre], [L_MAIL, consultor.correo], [L_PHONE, consultor.telefono]];
  const clRows: [string,string][] = [[L_NAME, cliente.nombre], [L_ADDR, cliente.direccion], [L_MAIL, cliente.correo], [L_PHONE, cliente.telefono]];
  const maxIC = Math.max(cRows.length, clRows.length);

  cardHdr(M,        y, HALF, HDR + maxIC * RH, HDR, NAVY, tr('CONSULTOR', 'CONSULTANT'));
  cardHdr(M+HALF+4, y, HALF, HDR + maxIC * RH, HDR, NAVY, tr('CLIENTE', 'CUSTOMER'));
  for (let i = 0; i < maxIC; i++) {
    const ry = y + HDR + i * RH;
    if (i % 2 === 1) {
      doc.setFillColor(...T.rowAlt);
      doc.rect(M, ry, HALF, RH, 'F');
      doc.rect(M+HALF+4, ry, HALF, RH, 'F');
    }
    const renderCell = (x: number, w: number, lbl: string, val: string) => {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
      doc.text(lbl + ':', x + 3, ry + RH - 1.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textPrimary);
      doc.text(val || '—', x + w - 3, ry + RH - 1.5, { align: 'right' });
    };
    if (i < cRows.length)  renderCell(M,        HALF, cRows[i][0],  cRows[i][1]);
    if (i < clRows.length) renderCell(M+HALF+4, HALF, clRows[i][0], clRows[i][1]);
  }
  y += HDR + maxIC * RH + 4;

  // ── Shared System Summary ────────────────────────────────────────────────
  const mid = M + CW / 2;
  const NA = tr('No aplica', 'N/A');
  const BAT_SING = tr('Batería', 'Battery');
  const BAT_PLUR = tr('Baterías', 'Batteries');
  const PLACAS = tr('Placas', 'Panels');
  const sysRows: [string,string,string,string][] = [
    [tr('Área Total', 'Total Area'),     `${baseInputs.roofSqft.toLocaleString('en-US')} sqft`,
     tr('Sistema Solar', 'Solar System'),  baseInputs.panels > 0 ? `${baseInputs.panels} ${PLACAS} · ${(allResults[0].systemSize/1000).toFixed(2)} kW` : NA],
    [tr('Financiamiento', 'Financing'), baseInputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank',
     BAT_PLUR,       baseInputs.batteries > 0 ? `${baseInputs.batteries} ${baseInputs.batteries === 1 ? BAT_SING : BAT_PLUR}` : NA],
  ];
  if (baseInputs.removalPercentage > 0 || baseInputs.manualPronto > 0) {
    sysRows.push([
      tr('% Remoción', '% Removal'),      baseInputs.removalPercentage > 0 ? `${Math.round(baseInputs.removalPercentage * 100)}%` : '—',
      tr('Pronto Adicional', 'Additional Down'), baseInputs.manualPronto > 0 ? `-${fmt(baseInputs.manualPronto)}` : '—',
    ]);
  }
  const sysH = HDR + sysRows.length * DR;
  cardHdr(M, y, CW, sysH, HDR, ORANGE, tr('CONFIGURACIÓN DEL SISTEMA', 'SYSTEM CONFIGURATION'));
  sysRows.forEach(([l1, v1, l2, v2], i) => {
    const ry = y + HDR + i * DR;
    if (i % 2 === 1) { doc.setFillColor(...T.rowAlt); doc.rect(M, ry, CW, DR, 'F'); }
    doc.setFontSize(7.2); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
    doc.text(l1 + ':', M + 3, ry + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textPrimary);
    doc.text(v1, mid - 4, ry + DR - 1.3, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textLabel);
    doc.text(l2 + ':', mid + 4, ry + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textPrimary);
    doc.text(v2, M + CW - 3, ry + DR - 1.3, { align: 'right' });
  });
  y += sysH + 4;

  // ── Comparison Table ─────────────────────────────────────────────────────
  const LABEL_W = 55;
  const COL_GAP = 2;
  const PLAN_W  = (CW - LABEL_W - (N - 1) * COL_GAP) / N;
  const planX   = plans.map((_, i) => M + LABEL_W + i * (PLAN_W + COL_GAP));
  const PLAN_HDR_H = 8;

  // Flags for optional rows
  const showRemoval  = baseInputs.removalPercentage > 0;
  const showCashDisc = baseInputs.roofCashDiscount;
  const showSolarCli = baseInputs.existingSolarCustomer;
  const showPanels   = baseInputs.panels > 0;
  const showBatt     = baseInputs.batteries > 0;
  const showWarranty = baseInputs.extendedWarranty && (showPanels || showBatt);
  const showVip      = baseInputs.vipDiscount;
  const showEmpl     = baseInputs.employeeDiscountKey !== 'Ninguno';
  const showPronte   = baseInputs.manualPronto > 0;

  // Calculate table body height
  let tableBodyH = 0;
  tableBodyH += SUB_H + DR + DR;                              // ROOFING: header + tasa + base
  if (showRemoval)  tableBodyH += DR;
  if (showCashDisc) tableBodyH += DR;
  if (showSolarCli) tableBodyH += DR;
  tableBodyH += DR;                                           // IVU
  if (showPanels || showBatt) {
    tableBodyH += SUB_H;
    if (showPanels)   tableBodyH += DR;
    if (showBatt)     tableBodyH += DR;
    if (showWarranty) tableBodyH += DR;
  }
  // Promociones — Madres / Farmacias
  const showMadresPre    = !!(promos?.madresRoofing || promos?.madresSolar);
  const showFarmaciasPre = !!(promos?.farmaciasRoofing || promos?.farmaciasSolar);
  if (showVip || showEmpl || showMadresPre || showFarmaciasPre) {
    tableBodyH += SUB_H;
    if (showVip)  tableBodyH += DR;
    if (showEmpl) tableBodyH += DR;
    if (promos?.madresRoofing)    tableBodyH += DR;
    if (promos?.madresSolar)      tableBodyH += DR;
    if (promos?.farmaciasRoofing) tableBodyH += DR;
    if (promos?.farmaciasSolar)   tableBodyH += DR;
  }
  tableBodyH += SUB_H + DR;                                  // TOTALES: header + cash
  if (showPronte) tableBodyH += DR;
  tableBodyH += DR;                                           // balance financiado
  tableBodyH += 2;                                            // bottom padding

  const totalTableH = HDR + PLAN_HDR_H + tableBodyH;

  // Draw table container
  doc.setFillColor(...T.sectionBg);
  doc.roundedRect(M, y, CW, totalTableH, 2, 2, 'F');
  // Title bar
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, CW, HDR, 2, 2, 'F');
  doc.rect(M, y + HDR - 2, CW, 2, 'F');
  doc.setTextColor(...WHITE); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
  doc.text(tr('DESGLOSE COMPARATIVO DE PRECIOS', 'COMPARATIVE PRICE BREAKDOWN'), M + 4, y + HDR - 1.8);
  y += HDR;

  // Plan header badges
  doc.setFillColor(...NAVY);
  doc.rect(M, y, CW, PLAN_HDR_H, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
  doc.text(tr('CONCEPTO', 'CONCEPT'), M + 3, y + PLAN_HDR_H - 2);
  plans.forEach((plan, i) => {
    const pc = PLAN_COLORS[plan];
    const px = planX[i];
    doc.setFillColor(...pc);
    doc.roundedRect(px + 1, y + 1, PLAN_W - 2, PLAN_HDR_H - 2, 1.5, 1.5, 'F');
    doc.setTextColor(...WHITE); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(plan, px + PLAN_W / 2, y + PLAN_HDR_H - 2.2, { align: 'center' });
  });
  y += PLAN_HDR_H;

  // Row drawing helpers
  let dataIdx = 0;

  const drawSub = (label: string) => {
    const subBg: [number,number,number] = isDarkMode ? [50, 62, 108] : [220, 228, 245];
    doc.setFillColor(...subBg);
    doc.rect(M, y, CW, SUB_H, 'F');
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(isDarkMode ? LBLUE : NAVY));
    doc.text(label, M + 3, y + SUB_H - 0.8);
    y += SUB_H;
  };

  const drawRow = (label: string, values: string[], isDisc = false, isTotal = false) => {
    if (dataIdx % 2 === 1) { doc.setFillColor(...T.rowAlt); doc.rect(M, y, CW, DR, 'F'); }
    doc.setFontSize(isTotal ? 7.5 : 7);
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    // Totales antes en ORANGE — ahora NAVY para reducir naranja
    doc.setTextColor(...(isTotal ? NAVY : T.textLabel));
    doc.text(label, M + 3, y + DR - 1.3);
    values.forEach((val, i) => {
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setTextColor(...(isTotal ? NAVY : isDisc ? RED : T.textPrimary));
      doc.text(val, planX[i] + PLAN_W - 2, y + DR - 1.3, { align: 'right' });
    });
    y += DR;
    dataIdx++;
  };

  // ROOFING rows
  drawSub('ROOFING');
  drawRow(tr('Tasa/sqft', 'Rate/sqft'),            plans.map(p => `$${ROOF_PLAN_RATES[p].toFixed(2)}/sqft`));
  drawRow(tr('Valor Base Roofing', 'Roofing Base Value'),   allResults.map(r => fmt(r.roofBaseValue)));
  if (showRemoval)  drawRow(tr('Remoción de Sellado', 'Sealing Removal'),  allResults.map(r => fmt(r.roofRemovalValue)));
  if (showCashDisc) drawRow(tr('Desc. Cash (10%)', 'Cash Disc. (10%)'),    allResults.map(r => `-${fmt(r.roofCashDiscountValue)}`), true);
  if (showSolarCli) drawRow(tr('Desc. Cliente Solar', 'Solar Customer Disc.'),   allResults.map(() => `-${fmt(allResults[0].vipRoofingDiscount)}`), true);
  drawRow(tr('IVU (Exento - Proy. Completo)', 'Tax (Exempt - Complete Project)'), plans.map(() => '$0.00'));

  // SOLAR & BATERÍAS rows
  if (showPanels || showBatt) {
    drawSub(tr('SOLAR & BATERÍAS', 'SOLAR & BATTERIES'));
    if (showPanels)   drawRow(`${PLACAS} (${(allResults[0].systemSize/1000).toFixed(2)} kW)`, allResults.map(r => fmt(r.solarValue)));
    if (showBatt)     drawRow(`${BAT_PLUR} (${baseInputs.batteries})`,                        allResults.map(r => fmt(r.batteryValue)));
    if (showWarranty) drawRow(tr('Garantías Extendidas', 'Extended Warranties'),              allResults.map(r => fmt(r.solarWarrantyValue + r.batteryWarrantyValue)));
  }

  // DESCUENTOS rows
  const showMadres    = !!(promos?.madresRoofing || promos?.madresSolar);
  const showFarmacias = !!(promos?.farmaciasRoofing || promos?.farmaciasSolar);
  if (showVip || showEmpl || showMadres || showFarmacias) {
    drawSub(tr('DESCUENTOS', 'DISCOUNTS'));
    if (showVip)  drawRow(tr('Descuento VIP (5%)', 'VIP Discount (5%)'),                 allResults.map(r => `-${fmt(r.vipProjectDiscount)}`),   true);
    if (showEmpl) drawRow(`${tr('Desc.', 'Disc.')} ${baseInputs.employeeDiscountKey}`,   allResults.map(r => `-${fmt(r.employeeDiscountValue)}`), true);
    if (promos?.madresRoofing)    drawRow(tr('Promo Madres 2026 (Roofing)', "Mother's 2026 (Roofing)"), allResults.map(r => `-${fmt(r.madresRoofingDiscountValue)}`), true);
    if (promos?.madresSolar)      drawRow(tr('Promo Madres 2026 (Solar)', "Mother's 2026 (Solar)"),     allResults.map(r => `-${fmt(r.madresSolarDiscountValue)}`),   true);
    if (promos?.farmaciasRoofing) drawRow(tr('Promo Farmacias (Roofing, 10%)', 'Pharmacy Promo (Roofing, 10%)'), allResults.map(r => `-${fmt(r.farmaciasRoofingDiscountValue)}`), true);
    if (promos?.farmaciasSolar)   drawRow(tr('Promo Farmacias (Solar, 10%)', 'Pharmacy Promo (Solar, 10%)'),     allResults.map(r => `-${fmt(r.farmaciasSolarDiscountValue)}`),   true);
  }

  // TOTALES rows
  drawSub(tr('TOTALES', 'TOTALS'));
  drawRow(tr('VALOR CASH TOTAL', 'TOTAL CASH VALUE'),   allResults.map(r => fmt(r.cashValue)),        false, true);
  if (showPronte) drawRow(tr('Pronto Aportado', 'Down Payment'), plans.map(() => `-${fmt(baseInputs.manualPronto)}`), true);
  drawRow(tr('BALANCE A FINANCIAR', 'BALANCE TO FINANCE'), allResults.map(r => fmt(r.valorFinanciado)), false, true);

  y += 4;

  // ── Monthly Payments Comparison ──────────────────────────────────────────
  const hasRange    = allResults[0].monthlyPayments.some(p => p.maxAmount);
  const PAY_ROW_H   = hasRange ? 8 : 5.5;
  const numTerms    = allResults[0].monthlyPayments.length;
  const PAY_LBL_W   = 18;
  const APR_W       = 22;
  const PAY_PLAN_W  = (CW - PAY_LBL_W - APR_W - (N - 1) * COL_GAP) / N;
  const payPlanX    = plans.map((_, i) => M + PAY_LBL_W + APR_W + i * (PAY_PLAN_W + COL_GAP));

  const payH = HDR + 7 + numTerms * PAY_ROW_H + 2;
  cardHdr(M, y, CW, payH, HDR, ORANGE, tr('OPCIONES DE PAGO MENSUAL — COMPARATIVO', 'MONTHLY PAYMENT OPTIONS — COMPARISON'));

  let py = y + HDR;
  // Sub-header
  doc.setFillColor(...NAVY);
  doc.rect(M, py, CW, 7, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
  doc.text(tr('PLAZO', 'TERM'),  M + 3,              py + 5);
  doc.text('APR',    M + PAY_LBL_W + 3,  py + 5);
  plans.forEach((plan, i) => {
    const pc = PLAN_COLORS[plan];
    doc.setTextColor(pc[0], pc[1], pc[2]);
    doc.text(plan, payPlanX[i] + PAY_PLAN_W / 2, py + 5, { align: 'center' });
  });
  py += 7;

  allResults[0].monthlyPayments.forEach((pay, idx) => {
    if (idx % 2 === 1) { doc.setFillColor(...T.rowAlt); doc.rect(M, py, CW, PAY_ROW_H, 'F'); }
    const midY = py + PAY_ROW_H / 2;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textLabel);
    doc.text(`${pay.years} ${tr('años', 'years')}`, M + 3, midY + 1.2);
    const aprTxt = pay.maxRate
      ? `${(pay.rate * 100).toFixed(1)}-${(pay.maxRate * 100).toFixed(1)}%`
      : `${(pay.rate * 100).toFixed(2)}%`;
    doc.text(aprTxt, M + PAY_LBL_W + 3, midY + 1.2);
    plans.forEach((_, pi) => {
      const p = allResults[pi].monthlyPayments[idx];
      // Antes ORANGE — ahora T.textPrimary (negro) bold para reducir naranja
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
      if (p.maxAmount) {
        doc.setFontSize(6);
        doc.text(`${tr('Desde', 'From')}: ${fmt(p.amount)}`,    payPlanX[pi] + 1, midY - 1.5);
        doc.setTextColor(...NAVY);
        doc.text(`${tr('Hasta', 'Up to')}: ${fmt(p.maxAmount)}`, payPlanX[pi] + 1, midY + 3.0);
      } else {
        doc.setFontSize(7);
        doc.text(fmt(p.amount), payPlanX[pi] + PAY_PLAN_W - 2, midY + 1.2, { align: 'right' });
      }
    });
    py += PAY_ROW_H;
  });
  y += payH + 4;

  // ── Viability Badges ─────────────────────────────────────────────────────
  const BADGE_W = (CW - (N - 1) * COL_GAP) / N;
  const BADGE_H = 9.5;
  allResults.forEach((r, i) => {
    const bx = M + i * (BADGE_W + COL_GAP);
    const eligColor: [number,number,number] = r.conditionOk ? PLAN_COLORS[plans[i]] : RED;
    const badgeBg: [number,number,number]   = isDarkMode ? [45, 53, 97] : WHITE;
    doc.setFillColor(...badgeBg);
    if (!isDarkMode) { doc.setDrawColor(...eligColor); doc.setLineWidth(0.3); doc.roundedRect(bx, y, BADGE_W, BADGE_H, 2, 2, 'FD'); }
    else             { doc.roundedRect(bx, y, BADGE_W, BADGE_H, 2, 2, 'F'); }
    doc.setFillColor(...eligColor);
    doc.rect(bx + 3, y + 3.2, 3, 3, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...eligColor);
    doc.text(
      r.conditionOk ? tr('PROYECTO ELEGIBLE', 'ELIGIBLE') : tr('NO ELEGIBLE', 'NOT ELIGIBLE'),
      bx + 8, y + 6.5
    );
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
    doc.text(
      `${plans[i]} · Share: ${(r.roofShare*100).toFixed(1)}% / ${tr('Lím', 'Lim')}: ${(r.roofLimit*100).toFixed(0)}%`,
      bx + BADGE_W - 3, y + 6.5, { align: 'right' }
    );
  });
  y += BADGE_H;

  // ── BANNERS DE PROMOCIONES (Madres + Farmacias) ───────────────────────────
  if (showMadresPre) {
    y += 3;
    const BANNER_H = 12;
    doc.setFillColor(...MADRES_PINK_BG);
    doc.setDrawColor(...MADRES_PINK_BORDER); doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, BANNER_H, 2, 2, 'FD');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MADRES_PINK_TEXT);
    doc.text(
      tr('♥ ♥ Promo Mes de las Madres 2026 ♥ ♥', "♥ ♥ Mother's Day Promo 2026 ♥ ♥"),
      PW/2, y + 4.5, { align: 'center' }
    );
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(
      tr(
        'Descuentos aplicados · Vigente del 7 al 14 de mayo 2026 · Solo en showroom con cliente citado',
        'Promo discounts applied · Valid May 7–14, 2026 · In-showroom only with scheduled customer',
      ),
      PW/2, y + 8.5, { align: 'center' }
    );
    doc.setFontSize(6.5);
    doc.text('Roosevelt · Mayagüez · Ponce · Hatillo', PW/2, y + 11.5, { align: 'center' });
    y += BANNER_H;
  }

  if (showFarmaciasPre) {
    y += 3;
    const BANNER_H = 10;
    doc.setFillColor(...FARM_GREEN_BG);
    doc.setDrawColor(...FARM_GREEN_BORDER); doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CW, BANNER_H, 2, 2, 'FD');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...FARM_GREEN_TEXT);
    doc.text(
      tr('Promo Farmacias — 10% Descuento', 'Pharmacy Promo — 10% Off'),
      PW/2, y + 4.5, { align: 'center' }
    );
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(
      tr(
        'Aplica a profesionales licenciados de farmacia · Validación en showroom',
        'For licensed pharmacy professionals · In-showroom validation',
      ),
      PW/2, y + 8.5, { align: 'center' }
    );
    y += BANNER_H;
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  const FH = 19.4;
  const FY = PH - FH;
  doc.setDrawColor(...ORANGE); doc.setLineWidth(1.1);
  doc.line(0, FY, PW, FY);
  doc.setFillColor(...NAVY);
  doc.rect(0, FY + 1, PW, FH, 'F');
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text(
    tr(`© 2026 Windmar Home · Generado el ${date}`, `© 2026 Windmar Home · Generated on ${date}`),
    PW / 2, FY + 8,  { align: 'center' }
  );
  doc.text(
    tr('787-395-7766 | LÍNEA WINDMAR HOME', '787-395-7766 | WINDMAR HOME LINE'),
    PW / 2, FY + 13, { align: 'center' }
  );

  // ── Merge & Save ────────────────────────────────────────────────────────
  const clienteName = cliente.nombre.trim().replace(/\s+/g, '_') || 'Cliente';
  const today       = new Date().toLocaleDateString('es-PR').replace(/\//g, '-');
  const fileName    = `Cotizacion_Windmar_${clienteName}_Comparativa_${today}.pdf`;
  const quoteBytes  = doc.output('arraybuffer');

  try {
    const resp = await fetch('/ProyectoCompleto.pdf');
    if (!resp.ok) throw new Error('No se pudo cargar ProyectoCompleto.pdf');
    const proyectoBytes = await resp.arrayBuffer();
    const merged   = await PDFDocument.create();
    const quotePdf = await PDFDocument.load(quoteBytes);
    const instPdf  = await PDFDocument.load(proyectoBytes);
    const instPages = await merged.copyPages(instPdf, instPdf.getPageIndices());
    const [quotePg] = await merged.copyPages(quotePdf, [0]);
    if (instPages.length > 0) merged.addPage(instPages[0]);
    merged.addPage(quotePg);
    for (let i = 1; i < instPages.length; i++) merged.addPage(instPages[i]);
    const mergedBytes = await merged.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  } catch {
    doc.save(fileName);
  }
}
