import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { QuoteInputs, QuoteResults } from '../types';
import { ROOF_PLAN_RATES } from '../constants';

export interface ConsultorInfo { nombre: string; correo: string; telefono: string; }
export interface ClienteInfo   { nombre: string; direccion: string; correo: string; telefono: string; }

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
    textPrimary: [35,  31,  32 ],  // #231F20
    textLabel:   [29,  66,  155],  // #1D429B (azul para labels)
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
  isDarkMode  = false
): Promise<void> {

  const T   = getTheme(isDarkMode);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW  = doc.internal.pageSize.getWidth();   // 215.9 mm
  const PH  = doc.internal.pageSize.getHeight();  // 279.4 mm
  const M   = 12;
  const CW  = PW - M * 2;
  const date = new Date().toLocaleDateString('es-PR', { day: '2-digit', month: 'long', year: 'numeric' });

  const logoData = await loadLogo('https://i.postimg.cc/RF76rLv3/logo.png');

  // ── Fondo completo ───────────────────────────────────────────────────────
  doc.setFillColor(...T.pageBg);
  doc.rect(0, 0, PW, PH, 'F');

  // ── Barra naranja superior ───────────────────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, PW, 2.2, 'F');

  // ── Logo — tamaño calculado por aspect ratio, centrado en el header ──────
  if (logoData) {
    // Área del header: y=2.2mm (barra naranja) a y=24.5mm (separador) = 22.3mm
    // Altura máx del logo: 16mm. Ancho calculado por aspect ratio, máx 60mm.
    const logoH = Math.min(16, 22.3 * 0.72);          // 72% del área del header
    const logoW = Math.min(60, logoH * logoData.aspectRatio);
    const logoY = 2.2 + (22.3 - logoH) / 2;           // centrado vertical en el header
    doc.addImage(logoData.dataUrl, 'PNG', M, logoY, logoW, logoH);
  } else {
    doc.setTextColor(...WHITE);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('WINDMAR HOME', M, 14);
  }

  // ── Header derecho ───────────────────────────────────────────────────────
  const rx = PW - M;
  doc.setFontSize(9);   doc.setFont('helvetica', 'bold');   doc.setTextColor(...ORANGE);
  doc.text('787-395-7766', rx, 9.5, { align: 'right' });
  doc.setFontSize(8);   doc.setFont('helvetica', 'normal'); doc.setTextColor(...LBLUE);
  doc.text('Línea Windmar Home', rx, 14, { align: 'right' });
  doc.setFontSize(7.5); doc.setTextColor(...MGRAY);
  doc.text('Roofing · Solar · Baterías de Alta Ingeniería', rx, 17.5, { align: 'right' });
  doc.setFontSize(8);   doc.setTextColor(...WHITE);
  doc.text(date, rx, 21.5, { align: 'right' });

  // ── Separador naranja ────────────────────────────────────────────────────
  let y = 24.5;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.55);
  doc.line(M, y, PW - M, y);
  y += 3;

  // ── Título ───────────────────────────────────────────────────────────────
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text('COTIZACIÓN — PROYECTO COMPLETO', M, y + 7);
  y += 9;
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
  doc.text('Roofing + Solar + Batería', M, y + 6);
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
  const cRows:  [string,string][] = [['Nombre', consultor.nombre], ['Correo', consultor.correo], ['Teléfono', consultor.telefono]];
  const clRows: [string,string][] = [['Nombre', cliente.nombre], ['Dirección', cliente.direccion], ['Correo', cliente.correo], ['Teléfono', cliente.telefono]];
  const maxIC = Math.max(cRows.length, clRows.length);

  cardHdr(M,        y, HALF, HDR + maxIC*RH, HDR, NAVY, 'CONSULTOR');
  cardHdr(M+HALF+4, y, HALF, HDR + maxIC*RH, HDR, NAVY, 'CLIENTE');

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
  const sumRows: [string,string,string,string][] = [
    ['Plan Roofing',   inputs.roofPlan,
     'Sistema Solar',  inputs.panels > 0 ? `${inputs.panels} Placas · ${(results.systemSize/1000).toFixed(2)} kW` : 'No aplica'],
    ['Área Total',     `${inputs.roofSqft.toLocaleString('en-US')} sqft`,
     'Baterías',       inputs.batteries > 0 ? `${inputs.batteries} ${inputs.batteries===1?'Batería':'Baterías'}` : 'No aplica'],
    ['Financiamiento', inputs.financing==='WH'?'WH Financial':'Oriental Bank',
     'Valor Cash Total', fmt(results.cashValue)],
    ['Pronto / Rebaja', inputs.manualPronto>0?`-${fmt(inputs.manualPronto)}`:'—',
     'Balance a Financiar', fmt(results.valorFinanciado)],
  ];
  const sumH = HDR + sumRows.length * DR;
  cardHdr(M, y, CW, sumH, HDR, ORANGE, 'RESUMEN DEL PROYECTO');
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

  const roofR: [string,string][] = [['Plan', inputs.roofPlan], ['Área', `${inputs.roofSqft.toLocaleString('en-US')} sqft`]];
  if (inputs.removalPercentage > 0) {
    roofR.push(['Área Remoción', `${Math.round(inputs.removalPercentage*100)}%`]);
    roofR.push(['Costo Remoción', fmt(results.roofRemovalValue)]);
  }
  if (inputs.roofCashDiscount) roofR.push(['Desc. Cash', '10%']);
  roofR.push(['Valor Base', fmt(results.roofBaseValue)]);

  const solR: [string,string][] = [];
  if (inputs.panels > 0) { solR.push(['Placas', `${inputs.panels}`]); solR.push(['Potencia', `${(results.systemSize/1000).toFixed(2)} kW`]); }
  if (inputs.batteries > 0) solR.push(['Baterías', `${inputs.batteries} ${inputs.batteries===1?'Batería':'Baterías'}`]);
  if (inputs.extendedWarranty) solR.push(['Garantía', 'Incluida']);
  if (solR.length === 0) solR.push(['Sistema Solar', 'No aplica']);

  const finR: [string,string][] = [['Entidad', inputs.financing==='WH'?'WH Financial':'Oriental Bank']];
  if (inputs.vipDiscount) finR.push(['Desc. VIP', '5%']);
  if (inputs.existingSolarCustomer) finR.push(['Cliente Solar', 'Sí']);
  if (inputs.employeeDiscountKey !== 'Ninguno') finR.push(['Desc. Empleado', inputs.employeeDiscountKey]);
  if (inputs.applyOrientalSpecialDiscount && inputs.financing==='ORIENTAL') finR.push(['Bono Oriental', '-$12,500']);

  const maxC3 = Math.max(roofR.length, solR.length, finR.length);
  const c3H   = HDR + maxC3 * DR;

  const drawSys = (x: number, title: string, titleBg: [number,number,number], rows: [string,string][], border=false) => {
    cardHdr(x, y, C3W, c3H, HDR, titleBg, title, border);
    rows.forEach(([lbl, val], i) => { if (lbl) labelVal(x, y + HDR + i * DR, C3W, lbl, val, i); });
  };

  // En modo oscuro: FINANCIAMIENTO usa T.pageBg como fondo del header (efecto flotante + borde naranja)
  // En modo claro: usa NAVY para que el texto blanco sea legible
  const finTitleBg: [number,number,number] = isDarkMode ? T.pageBg : NAVY;

  drawSys(M,           'ROOFING',          NAVY,       roofR);
  drawSys(M+C3W+3,     'SOLAR & BATERÍAS', ORANGE,     solR);
  drawSys(M+(C3W+3)*2, 'FINANCIAMIENTO',   finTitleBg, finR, true);
  y += c3H + 4;

  // ── Desglose + Opciones de Pago (2 columnas) ─────────────────────────────
  const LW = Math.round(CW * 0.56);
  const RW = CW - LW - 4;
  const LX = M;
  const RX = M + LW + 4;

  const pRows: [string,string,boolean?][] = [['Valor Base Roofing', fmt(results.roofBaseValue)]];
  if (results.roofRemovalValue > 0)   pRows.push(['Remoción de Sellado', fmt(results.roofRemovalValue)]);
  if (inputs.roofCashDiscount)        pRows.push(['Descuento Cash (10%)', `-${fmt(results.roofCashDiscountValue)}`, true]);
  pRows.push(['IVU (Exento)', fmt(results.roofIvu)]);
  if (inputs.existingSolarCustomer)   pRows.push(['Desc. Cliente Solar', `-${fmt(results.vipRoofingDiscount)}`, true]);
  if (inputs.panels > 0)              pRows.push([`Placas (${(results.systemSize/1000).toFixed(2)} kW)`, fmt(results.solarValue)]);
  if (results.batteryValue > 0)       pRows.push(['Baterías', fmt(results.batteryValue)]);
  if (results.solarWarrantyValue + results.batteryWarrantyValue > 0)
    pRows.push(['Garantías', fmt(results.solarWarrantyValue + results.batteryWarrantyValue)]);
  if (inputs.vipDiscount)             pRows.push(['Descuento VIP (5%)', `-${fmt(results.vipProjectDiscount)}`, true]);
  if (results.employeeDiscountValue > 0)
    pRows.push([`Desc. Empleado`, `-${fmt(results.employeeDiscountValue)}`, true]);

  const hasPronte = inputs.manualPronto > 0;
  const leftExtra = (hasPronte ? 9 : 0);
  const leftH = HDR + pRows.length * DR + 2 + 9 + leftExtra + 9.5;

  const hasRangePay = results.monthlyPayments.some(p => p.maxAmount);
  const PAY_H  = hasRangePay ? 10 : 6.5;
  const rightH = HDR + 7 + results.monthlyPayments.length * PAY_H + 12;
  const colH   = Math.max(leftH, rightH);

  // — Desglose (izquierda)
  cardHdr(LX, y, LW, colH, HDR, NAVY, 'DESGLOSE DE PRECIOS');
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
  // Línea separadora naranja
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.5);
  doc.line(LX + 3, ly + 1, LX + LW - 3, ly + 1);
  ly += 3;
  // Valor Cash Total
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
  doc.text('VALOR CASH TOTAL', LX + 3, ly + 5.5);
  doc.text(fmt(results.cashValue), LX + LW - 3, ly + 5.5, { align: 'right' });
  ly += 8;
  if (hasPronte) {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textLabel);
    doc.text('Pronto Aportado', LX + 3, ly + 5.5);
    doc.text(`-${fmt(inputs.manualPronto)}`, LX + LW - 3, ly + 5.5, { align: 'right' });
    ly += 8;
  }
  // Balance a Financiar
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text('BALANCE A FINANCIAR', LX + 3, ly + 5.5);
  doc.text(fmt(results.valorFinanciado), LX + LW - 3, ly + 5.5, { align: 'right' });

  // — Opciones de Pago (derecha)
  cardHdr(RX, y, RW, colH, HDR, ORANGE, 'OPCIONES DE PAGO MENSUAL');
  let ry = y + HDR;
  // Cabecera de tabla
  doc.setFillColor(...NAVY);
  doc.rect(RX, ry, RW, 7, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
  const c1=RX+3, c2=RX+22, c3=RX+48;
  doc.text('PLAZO',        c1, ry + 5);
  doc.text('APR',          c2, ry + 5);
  doc.text('PAGO MENSUAL', c3, ry + 5);
  ry += 7;

  results.monthlyPayments.forEach((pay, idx) => {
    if (idx%2===1) { doc.setFillColor(...T.rowAlt); doc.rect(RX, ry, RW, PAY_H, 'F'); }
    const midY = ry + PAY_H / 2;
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...T.textLabel);
    doc.text(`${pay.years} años`, c1, midY + 1.2);
    const aprTxt = pay.maxRate
      ? `${(pay.rate*100).toFixed(1)}-${(pay.maxRate*100).toFixed(1)}%`
      : `${(pay.rate*100).toFixed(2)}%`;
    doc.text(aprTxt, c2, midY + 1.2);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
    if (pay.maxAmount) {
      // Mostrar rango Desde / Hasta en dos líneas
      doc.setFontSize(6.5);
      doc.text(`Desde: ${fmt(pay.amount)}`,    c3, midY - 1.2);
      doc.setTextColor(...LBLUE);
      doc.text(`Hasta: ${fmt(pay.maxAmount)}`, c3, midY + 3.2);
    } else {
      doc.setFontSize(7);
      doc.text(fmt(pay.amount), c3, midY + 1.2);
    }
    ry += PAY_H;
  });
  ry += 3;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text('Balance a Financiar', c1, ry + 5);
  doc.setTextColor(...ORANGE); doc.setFontSize(9);
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
  doc.text(results.conditionOk ? 'PROYECTO ELEGIBLE' : 'PROYECTO NO ELEGIBLE', M + 8, y + 6.5);
  // Roofing share a la derecha
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
  doc.text(
    `Roofing Share: ${(results.roofShare*100).toFixed(1)}%  |  Límite: ${(results.roofLimit*100).toFixed(0)}%`,
    M + CW - 4, y + 6.5, { align: 'right' }
  );
  y += 9.5;

  if (!results.conditionOk && results.requiredProntoForCompliance > 0) {
    y += 3;
    doc.setFillColor(...AMBER);
    doc.roundedRect(M, y, CW, 7.5, 2, 2, 'F');
    doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(`! Para elegibilidad se requiere pronto de: ${fmt(results.requiredProntoForCompliance)}`, PW/2, y + 5, { align: 'center' });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const FH = 19.4;
  const FY = PH - FH;
  doc.setDrawColor(...ORANGE); doc.setLineWidth(1.1);
  doc.line(0, FY, PW, FY);
  doc.setFillColor(...NAVY);
  doc.rect(0, FY + 1, PW, FH, 'F');
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text(`© 2026 Windmar Home · Generado el ${date}`, PW/2, FY + 8,  { align: 'center' });
  doc.text('787-395-7766 | LÍNEA WINDMAR HOME',         PW/2, FY + 13, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('Página 2', PW - M, FY + 8, { align: 'right' });

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
  isDarkMode   = false
): Promise<void> {

  const T   = getTheme(isDarkMode);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const M   = 12;
  const CW  = PW - M * 2;
  const date = new Date().toLocaleDateString('es-PR', { day: '2-digit', month: 'long', year: 'numeric' });
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
  doc.setFontSize(9);   doc.setFont('helvetica', 'bold');   doc.setTextColor(...ORANGE);
  doc.text('787-395-7766', rx, 9.5,  { align: 'right' });
  doc.setFontSize(8);   doc.setFont('helvetica', 'normal'); doc.setTextColor(...LBLUE);
  doc.text('Línea Windmar Home', rx, 14, { align: 'right' });
  doc.setFontSize(7.5); doc.setTextColor(...MGRAY);
  doc.text('Roofing · Solar · Baterías de Alta Ingeniería', rx, 17.5, { align: 'right' });
  doc.setFontSize(8);   doc.setTextColor(...WHITE);
  doc.text(date, rx, 21.5, { align: 'right' });

  // ── Separator ───────────────────────────────────────────────────────────
  let y = 24.5;
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.55);
  doc.line(M, y, PW - M, y);
  y += 3;

  // ── Title ───────────────────────────────────────────────────────────────
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...T.textPrimary);
  doc.text('COMPARATIVA — PROYECTO COMPLETO', M, y + 7);
  y += 9;
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
  const planLabel = plans.map(p => p.charAt(0) + p.slice(1).toLowerCase()).join(' · ');
  doc.text(`${planLabel}  ·  Roofing + Solar + Batería`, M, y + 5.5);
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
  const cRows:  [string,string][] = [['Nombre', consultor.nombre], ['Correo', consultor.correo], ['Teléfono', consultor.telefono]];
  const clRows: [string,string][] = [['Nombre', cliente.nombre], ['Dirección', cliente.direccion], ['Correo', cliente.correo], ['Teléfono', cliente.telefono]];
  const maxIC = Math.max(cRows.length, clRows.length);

  cardHdr(M,        y, HALF, HDR + maxIC * RH, HDR, NAVY, 'CONSULTOR');
  cardHdr(M+HALF+4, y, HALF, HDR + maxIC * RH, HDR, NAVY, 'CLIENTE');
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
  const sysRows: [string,string,string,string][] = [
    ['Área Total',     `${baseInputs.roofSqft.toLocaleString('en-US')} sqft`,
     'Sistema Solar',  baseInputs.panels > 0 ? `${baseInputs.panels} Placas · ${(allResults[0].systemSize/1000).toFixed(2)} kW` : 'No aplica'],
    ['Financiamiento', baseInputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank',
     'Baterías',       baseInputs.batteries > 0 ? `${baseInputs.batteries} ${baseInputs.batteries === 1 ? 'Batería' : 'Baterías'}` : 'No aplica'],
  ];
  if (baseInputs.removalPercentage > 0 || baseInputs.manualPronto > 0) {
    sysRows.push([
      '% Remoción',      baseInputs.removalPercentage > 0 ? `${Math.round(baseInputs.removalPercentage * 100)}%` : '—',
      'Pronto Adicional', baseInputs.manualPronto > 0 ? `-${fmt(baseInputs.manualPronto)}` : '—',
    ]);
  }
  const sysH = HDR + sysRows.length * DR;
  cardHdr(M, y, CW, sysH, HDR, ORANGE, 'CONFIGURACIÓN DEL SISTEMA');
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
  if (showVip || showEmpl) {
    tableBodyH += SUB_H;
    if (showVip)  tableBodyH += DR;
    if (showEmpl) tableBodyH += DR;
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
  doc.text('DESGLOSE COMPARATIVO DE PRECIOS', M + 4, y + HDR - 1.8);
  y += HDR;

  // Plan header badges
  doc.setFillColor(...NAVY);
  doc.rect(M, y, CW, PLAN_HDR_H, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
  doc.text('CONCEPTO', M + 3, y + PLAN_HDR_H - 2);
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
    doc.setTextColor(...(isTotal ? ORANGE : T.textLabel));
    doc.text(label, M + 3, y + DR - 1.3);
    values.forEach((val, i) => {
      doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
      doc.setTextColor(...(isTotal ? ORANGE : isDisc ? RED : T.textPrimary));
      doc.text(val, planX[i] + PLAN_W - 2, y + DR - 1.3, { align: 'right' });
    });
    y += DR;
    dataIdx++;
  };

  // ROOFING rows
  drawSub('ROOFING');
  drawRow('Tasa/sqft',            plans.map(p => `$${ROOF_PLAN_RATES[p].toFixed(2)}/sqft`));
  drawRow('Valor Base Roofing',   allResults.map(r => fmt(r.roofBaseValue)));
  if (showRemoval)  drawRow('Remoción de Sellado',  allResults.map(r => fmt(r.roofRemovalValue)));
  if (showCashDisc) drawRow('Desc. Cash (10%)',      allResults.map(r => `-${fmt(r.roofCashDiscountValue)}`), true);
  if (showSolarCli) drawRow('Desc. Cliente Solar',   allResults.map(() => `-${fmt(allResults[0].vipRoofingDiscount)}`), true);
  drawRow('IVU (Exento - Proy. Completo)', plans.map(() => '$0.00'));

  // SOLAR & BATERÍAS rows
  if (showPanels || showBatt) {
    drawSub('SOLAR & BATERÍAS');
    if (showPanels)   drawRow(`Placas (${(allResults[0].systemSize/1000).toFixed(2)} kW)`, allResults.map(r => fmt(r.solarValue)));
    if (showBatt)     drawRow(`Baterías (${baseInputs.batteries})`,                        allResults.map(r => fmt(r.batteryValue)));
    if (showWarranty) drawRow('Garantías Extendidas',                                      allResults.map(r => fmt(r.solarWarrantyValue + r.batteryWarrantyValue)));
  }

  // DESCUENTOS rows
  if (showVip || showEmpl) {
    drawSub('DESCUENTOS');
    if (showVip)  drawRow('Descuento VIP (5%)',         allResults.map(r => `-${fmt(r.vipProjectDiscount)}`),   true);
    if (showEmpl) drawRow(`Desc. ${baseInputs.employeeDiscountKey}`, allResults.map(r => `-${fmt(r.employeeDiscountValue)}`), true);
  }

  // TOTALES rows
  drawSub('TOTALES');
  drawRow('VALOR CASH TOTAL',   allResults.map(r => fmt(r.cashValue)),        false, true);
  if (showPronte) drawRow('Pronto Aportado', plans.map(() => `-${fmt(baseInputs.manualPronto)}`), true);
  drawRow('BALANCE A FINANCIAR', allResults.map(r => fmt(r.valorFinanciado)), false, true);

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
  cardHdr(M, y, CW, payH, HDR, ORANGE, 'OPCIONES DE PAGO MENSUAL — COMPARATIVO');

  let py = y + HDR;
  // Sub-header
  doc.setFillColor(...NAVY);
  doc.rect(M, py, CW, 7, 'F');
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...LBLUE);
  doc.text('PLAZO',  M + 3,              py + 5);
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
    doc.text(`${pay.years} años`, M + 3, midY + 1.2);
    const aprTxt = pay.maxRate
      ? `${(pay.rate * 100).toFixed(1)}-${(pay.maxRate * 100).toFixed(1)}%`
      : `${(pay.rate * 100).toFixed(2)}%`;
    doc.text(aprTxt, M + PAY_LBL_W + 3, midY + 1.2);
    plans.forEach((_, pi) => {
      const p = allResults[pi].monthlyPayments[idx];
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
      if (p.maxAmount) {
        doc.setFontSize(6);
        doc.text(`Desde: ${fmt(p.amount)}`,    payPlanX[pi] + 1, midY - 1.5);
        doc.setTextColor(...LBLUE);
        doc.text(`Hasta: ${fmt(p.maxAmount)}`, payPlanX[pi] + 1, midY + 3.0);
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
    doc.text(r.conditionOk ? 'PROYECTO ELEGIBLE' : 'NO ELEGIBLE', bx + 8, y + 6.5);
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
    doc.text(
      `${plans[i]} · Share: ${(r.roofShare*100).toFixed(1)}% / Lím: ${(r.roofLimit*100).toFixed(0)}%`,
      bx + BADGE_W - 3, y + 6.5, { align: 'right' }
    );
  });
  y += BADGE_H;

  // ── Footer ──────────────────────────────────────────────────────────────
  const FH = 19.4;
  const FY = PH - FH;
  doc.setDrawColor(...ORANGE); doc.setLineWidth(1.1);
  doc.line(0, FY, PW, FY);
  doc.setFillColor(...NAVY);
  doc.rect(0, FY + 1, PW, FH, 'F');
  doc.setTextColor(...WHITE); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  doc.text(`© 2026 Windmar Home · Generado el ${date}`, PW / 2, FY + 8,  { align: 'center' });
  doc.text('787-395-7766 | LÍNEA WINDMAR HOME',         PW / 2, FY + 13, { align: 'center' });

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
