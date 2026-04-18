import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { QuoteInputs, QuoteResults } from '../types';

export interface ConsultorInfo { nombre: string; correo: string; telefono: string; }
export interface ClienteInfo   { nombre: string; direccion: string; correo: string; telefono: string; }

// ── Paleta ───────────────────────────────────────────────────────────────────
const BG:    [number,number,number] = [33,  39,  78 ]; // #21274E
const ORANGE:[number,number,number] = [248, 155, 36 ]; // #F89B24
const NAVY:  [number,number,number] = [29,  66,  155]; // #1D429B
const CARD:  [number,number,number] = [45,  53,  97 ]; // #2D3561
const RALT:  [number,number,number] = [53,  64,  128]; // #354080
const LBLUE: [number,number,number] = [166, 195, 230]; // #A6C3E6
const MGRAY: [number,number,number] = [167, 169, 172]; // #A7A9AC
const WHITE: [number,number,number] = [255, 255, 255];
const GREEN: [number,number,number] = [5,   150, 105];
const RED:   [number,number,number] = [220, 38,  38 ];
const AMBER: [number,number,number] = [217, 119, 6  ];

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

// Carga logo y elimina fondo negro por transparencia
async function loadLogo(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      img.src = url;
    });
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
    return canvas.toDataURL('image/png');
  } catch { return null; }
}

export async function generateQuotePDF(
  inputs:    QuoteInputs,
  results:   QuoteResults,
  consultor: ConsultorInfo,
  cliente:   ClienteInfo
): Promise<void> {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW  = doc.internal.pageSize.getWidth();   // 215.9 mm
  const PH  = doc.internal.pageSize.getHeight();  // 279.4 mm
  const M   = 12;
  const CW  = PW - M * 2;
  const date = new Date().toLocaleDateString('es-PR', { day: '2-digit', month: 'long', year: 'numeric' });

  const logoURL  = await loadLogo('https://i.postimg.cc/rpm1cW7z/ChatGPT-Image-Apr-18-2026-09-17-00-AM.png');

  // ── Fondo completo ───────────────────────────────────────────────────────
  doc.setFillColor(...BG);
  doc.rect(0, 0, PW, PH, 'F');

  // ── Barra naranja superior (6px ≈ 2.1mm) ────────────────────────────────
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, PW, 2.2, 'F');

  // ── Header ───────────────────────────────────────────────────────────────
  // Logo (izquierda) — 45mm × 15mm
  if (logoURL) {
    doc.addImage(logoURL, 'PNG', M, 4, 45, 15);
  } else {
    doc.setTextColor(...WHITE);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('WINDMAR HOME', M, 14);
  }

  // Info derecha
  const rx = PW - M;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
  doc.text('787-395-7766', rx, 9.5, { align: 'right' });

  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...LBLUE);
  doc.text('Línea Windmar Home', rx, 14, { align: 'right' });

  doc.setFontSize(7.5); doc.setTextColor(...MGRAY);
  doc.text('Roofing · Solar · Baterías de Alta Ingeniería', rx, 17.5, { align: 'right' });

  doc.setFontSize(8); doc.setTextColor(...WHITE);
  doc.text(date, rx, 21.5, { align: 'right' });

  // ── Línea separadora naranja ─────────────────────────────────────────────
  let y = 24.5;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.55);
  doc.line(M, y, PW - M, y);
  y += 3;

  // ── Título ───────────────────────────────────────────────────────────────
  doc.setFontSize(17); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
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
    doc.setFillColor(...CARD);
    doc.roundedRect(x, cy, w, h, 2, 2, 'F');
    if (border) { doc.setDrawColor(...ORANGE); doc.setLineWidth(0.35); doc.roundedRect(x, cy, w, h, 2, 2, 'S'); }
    doc.setFillColor(...titleBg);
    doc.roundedRect(x, cy, w, titleH, 2, 2, 'F');
    doc.rect(x, cy + titleH - 2, w, 2, 'F');                // elimina borde inferior redondeado
    if (border) { doc.setDrawColor(...ORANGE); doc.roundedRect(x, cy, w, titleH, 2, 2, 'S'); }
    doc.setTextColor(...WHITE);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(title, x + 4, cy + titleH - 1.8);
  }

  function labelVal(x: number, cy: number, w: number,
                    label: string, value: string, idx: number,
                    valColor: [number,number,number] = WHITE): void {
    if (idx % 2 === 1) { doc.setFillColor(...RALT); doc.rect(x, cy, w, DR, 'F'); }
    doc.setFontSize(7.2); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MGRAY);
    doc.text(label + ':', x + 3, cy + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...valColor);
    doc.text(value, x + w - 3, cy + DR - 1.3, { align: 'right' });
  }

  // ── Consultor + Cliente ──────────────────────────────────────────────────
  const HALF = (CW - 4) / 2;

  const cRows: [string,string][] = [
    ['Nombre', consultor.nombre], ['Correo', consultor.correo], ['Teléfono', consultor.telefono],
  ];
  const clRows: [string,string][] = [
    ['Nombre', cliente.nombre], ['Dirección', cliente.direccion],
    ['Correo', cliente.correo], ['Teléfono', cliente.telefono],
  ];
  const maxIC = Math.max(cRows.length, clRows.length);

  cardHdr(M,           y, HALF, HDR + maxIC*RH, HDR, NAVY, 'CONSULTOR');
  cardHdr(M+HALF+4,    y, HALF, HDR + maxIC*RH, HDR, NAVY, 'CLIENTE');

  for (let i = 0; i < maxIC; i++) {
    const ry = y + HDR + i * RH;
    if (i % 2 === 1) {
      doc.setFillColor(...RALT);
      doc.rect(M,        ry, HALF, RH, 'F');
      doc.rect(M+HALF+4, ry, HALF, RH, 'F');
    }
    const render = (x: number, w: number, lbl: string, val: string) => {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MGRAY);
      doc.text(lbl + ':', x + 3, ry + RH - 1.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...WHITE);
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
    if (i % 2 === 1) { doc.setFillColor(...RALT); doc.rect(M, ry, CW, DR, 'F'); }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MGRAY);
    doc.text(l1 + ':', M + 3, ry + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...WHITE);
    doc.text(v1, mid - 4, ry + DR - 1.3, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...MGRAY);
    doc.text(l2 + ':', mid + 4, ry + DR - 1.3);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...WHITE);
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
  drawSys(M,            'ROOFING',          NAVY,   roofR);
  drawSys(M+C3W+3,      'SOLAR & BATERÍAS', ORANGE, solR);
  drawSys(M+(C3W+3)*2,  'FINANCIAMIENTO',   BG,     finR, true);
  y += c3H + 4;

  // ── Desglose + Opciones (2 columnas) ────────────────────────────────────
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

  const PAY_H  = 6.5;
  const rightH = HDR + 7 + results.monthlyPayments.length * PAY_H + 12;
  const colH   = Math.max(leftH, rightH);

  // — Desglose (izquierda)
  cardHdr(LX, y, LW, colH, HDR, NAVY, 'DESGLOSE DE PRECIOS');
  let ly = y + HDR;
  pRows.forEach(([lbl, val, isDisc], i) => {
    if (i%2===1) { doc.setFillColor(...RALT); doc.rect(LX, ly, LW, DR, 'F'); }
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...MGRAY);
    doc.text(lbl, LX + 3, ly + DR - 1.3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(isDisc ? ORANGE : WHITE));
    doc.text(val, LX + LW - 3, ly + DR - 1.3, { align: 'right' });
    ly += DR;
  });
  // Línea naranja separadora
  doc.setDrawColor(...ORANGE); doc.setLineWidth(0.5);
  doc.line(LX + 3, ly + 1, LX + LW - 3, ly + 1);
  ly += 3;
  // Valor Cash Total
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
  doc.text('VALOR CASH TOTAL',  LX + 3, ly + 5.5);
  doc.text(fmt(results.cashValue), LX + LW - 3, ly + 5.5, { align: 'right' });
  ly += 8;
  if (hasPronte) {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
    doc.text('Pronto Aportado',             LX + 3, ly + 5.5);
    doc.text(`-${fmt(inputs.manualPronto)}`, LX + LW - 3, ly + 5.5, { align: 'right' });
    ly += 8;
  }
  // Balance a Financiar
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
  doc.text('BALANCE A FINANCIAR',        LX + 3, ly + 5.5);
  doc.text(fmt(results.valorFinanciado), LX + LW - 3, ly + 5.5, { align: 'right' });

  // — Opciones de pago (derecha)
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
    if (idx%2===1) { doc.setFillColor(...RALT); doc.rect(RX, ry, RW, PAY_H, 'F'); }
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MGRAY);
    doc.text(`${pay.years} años`, c1, ry + PAY_H - 1.8);
    const aprTxt = pay.maxRate
      ? `${(pay.rate*100).toFixed(1)}-${(pay.maxRate*100).toFixed(1)}%`
      : `${(pay.rate*100).toFixed(2)}%`;
    doc.text(aprTxt, c2, ry + PAY_H - 1.8);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE);
    doc.text(fmt(pay.amount), c3, ry + PAY_H - 1.8);
    ry += PAY_H;
  });
  ry += 3;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE);
  doc.text('Balance a Financiar', c1, ry + 5);
  doc.setTextColor(...ORANGE); doc.setFontSize(9);
  doc.text(fmt(results.valorFinanciado), RX + RW - 3, ry + 5, { align: 'right' });

  y += colH + 4;

  // ── Badge de elegibilidad ─────────────────────────────────────────────────
  doc.setFillColor(...CARD);
  doc.roundedRect(M, y, CW, 9.5, 2, 2, 'F');
  const eligColor: [number,number,number] = results.conditionOk ? GREEN : RED;
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...eligColor);
  doc.text(results.conditionOk ? '✓ PROYECTO ELEGIBLE' : '✗ NO ELEGIBLE', M + 4, y + 6.5);
  doc.setFontSize(7.5); doc.setTextColor(...MGRAY);
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
    doc.text(`⚠ Para elegibilidad se requiere pronto de: ${fmt(results.requiredProntoForCompliance)}`, PW/2, y + 5, { align: 'center' });
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const FH  = 19.4;          // 55px ≈ 19.4mm
  const FY  = PH - FH;
  // Línea naranja sobre footer
  doc.setDrawColor(...ORANGE); doc.setLineWidth(1.1);
  doc.line(0, FY, PW, FY);
  // Fondo azul footer
  doc.setFillColor(...NAVY);
  doc.rect(0, FY + 1, PW, FH, 'F');
  // Texto
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

    const merged    = await PDFDocument.create();
    const quotePdf  = await PDFDocument.load(quoteBytes);
    const instPdf   = await PDFDocument.load(proyectoBytes);

    const instPages  = await merged.copyPages(instPdf,  instPdf.getPageIndices());
    const [quotePg]  = await merged.copyPages(quotePdf, [0]);

    // Pág 1: primera página institucional
    if (instPages.length > 0) merged.addPage(instPages[0]);
    // Pág 2: cotización
    merged.addPage(quotePg);
    // Págs 3+: resto institucional
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
