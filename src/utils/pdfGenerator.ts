import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { QuoteInputs, QuoteResults } from '../types';

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

const NAVY:         [number,number,number] = [20,  40,  100];
const BLUE:         [number,number,number] = [37,  99,  235];
const LIGHT_BLUE:   [number,number,number] = [219, 234, 254];
const SKY:          [number,number,number] = [191, 219, 254];
const WHITE:        [number,number,number] = [255, 255, 255];
const GRAY:         [number,number,number] = [107, 114, 128];
const LIGHT_GRAY:   [number,number,number] = [243, 246, 250];
const LIGHTER_GRAY: [number,number,number] = [249, 251, 253];
const DARK:         [number,number,number] = [15,  23,  42 ];
const GREEN:        [number,number,number] = [5,   150, 105];
const RED:          [number,number,number] = [220, 38,  38 ];
const AMBER:        [number,number,number] = [217, 119, 6  ];

function fmt(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
}

export async function generateQuotePDF(
  inputs: QuoteInputs,
  results: QuoteResults,
  consultor: ConsultorInfo,
  cliente: ClienteInfo
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const PW = doc.internal.pageSize.getWidth();   // 215.9 mm
  const PH = doc.internal.pageSize.getHeight();  // 279.4 mm
  const M  = 13;
  const CW = PW - M * 2;
  const date = new Date().toLocaleDateString('es-PR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── helpers ──────────────────────────────────────────
  function sectionHdr(x: number, cy: number, w: number, title: string): number {
    doc.setFillColor(...LIGHT_BLUE);
    doc.roundedRect(x, cy, w, 7, 1.2, 1.2, 'F');
    doc.setFillColor(...BLUE);
    doc.roundedRect(x, cy, 2.5, 7, 0.8, 0.8, 'F');
    doc.setTextColor(...NAVY);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 6, cy + 4.9);
    return cy + 7;
  }

  function subLabel(x: number, cy: number, w: number, txt: string): number {
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, cy, w, 5, 0.8, 0.8, 'F');
    doc.setTextColor(...SKY);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.text(txt, x + 3, cy + 3.4);
    return cy + 5;
  }

  function dataRows(
    x: number, cy: number, w: number,
    rows: [string, string, boolean?][]
  ): number {
    const RH = 5;
    rows.forEach(([lbl, val, isDisc], i) => {
      const bg: [number,number,number] = i % 2 === 0 ? LIGHTER_GRAY : WHITE;
      doc.setFillColor(...bg);
      doc.rect(x, cy, w, RH, 'F');
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(lbl, x + 3, cy + RH - 1.3);
      doc.setFont('helvetica', 'bold');
      if (isDisc) doc.setTextColor(...BLUE); else doc.setTextColor(...DARK);
      doc.text(val, x + w - 3, cy + RH - 1.3, { align: 'right' });
      cy += RH;
    });
    return cy;
  }

  function infoBlock(
    x: number, cy: number, w: number,
    title: string,
    rows: [string, string][]
  ): number {
    const RH = 5.5;
    doc.setFillColor(...NAVY);
    doc.roundedRect(x, cy, w, 7, 1.2, 1.2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 4, cy + 4.8);
    cy += 7;
    rows.forEach(([lbl, val], i) => {
      const bg: [number,number,number] = i % 2 === 0 ? LIGHT_GRAY : WHITE;
      doc.setFillColor(...bg);
      doc.rect(x, cy, w, RH, 'F');
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(lbl + ':', x + 3, cy + RH - 1.4);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(val || '—', x + w - 3, cy + RH - 1.4, { align: 'right' });
      cy += RH;
    });
    doc.setDrawColor(...SKY);
    doc.setLineWidth(0.3);
    doc.rect(x, cy - rows.length * RH - 7, w, rows.length * RH + 7);
    return cy;
  }

  // ── HEADER ───────────────────────────────────────────
  // Background gradient-style: deep navy top → blue strip
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PW, 30, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 30, PW, 3, 'F');

  // Decorative accent lines
  doc.setDrawColor(255, 255, 255, 0.08);
  doc.setLineWidth(18);
  doc.line(PW - 45, -5, PW + 10, 35);
  doc.setLineWidth(10);
  doc.line(PW - 65, -5, PW - 15, 35);

  doc.setTextColor(...WHITE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('WINDMAR HOME', M, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Roofing · Solar · Baterías de Alta Ingeniería', M, 22.5);

  // Contact (right)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('787-395-7766', PW - M, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Línea Windmar Home', PW - M, 20, { align: 'right' });

  // Date badge
  doc.setFillColor(...BLUE);
  doc.roundedRect(PW - M - 50, 22, 50, 7, 1.5, 1.5, 'F');
  doc.setDrawColor(...SKY);
  doc.setLineWidth(0.4);
  doc.roundedRect(PW - M - 50, 22, 50, 7, 1.5, 1.5, 'S');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(date, PW - M - 25, 26.8, { align: 'center' });

  // ── TITLE BANNER ─────────────────────────────────────
  let y = 36;
  doc.setFillColor(...BLUE);
  doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN — PROYECTO COMPLETO', PW / 2, y + 8, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...LIGHT_BLUE);
  doc.text(results.projectType, PW / 2, y + 12.5, { align: 'center' });
  y += 17;

  // ── CONSULTOR + CLIENTE ──────────────────────────────
  const HALF = (CW - 5) / 2;

  const cBottom = infoBlock(M, y, HALF, 'CONSULTOR', [
    ['Nombre', consultor.nombre],
    ['Correo', consultor.correo],
    ['Teléfono', consultor.telefono],
  ]);
  const clBottom = infoBlock(M + HALF + 5, y, HALF, 'CLIENTE', [
    ['Nombre', cliente.nombre],
    ['Dirección', cliente.direccion],
    ['Correo', cliente.correo],
    ['Teléfono', cliente.telefono],
  ]);
  y = Math.max(cBottom, clBottom) + 4;

  // ── PROJECT SUMMARY (2-col grid) ─────────────────────
  y = sectionHdr(M, y, CW, 'RESUMEN DEL PROYECTO');

  const sumL: [string, string][] = [
    ['Plan Roofing', inputs.roofPlan],
    ['Área Total', `${inputs.roofSqft.toLocaleString('en-US')} sqft`],
    ['Sistema Solar', inputs.panels > 0 ? `${inputs.panels} Placas · ${(results.systemSize / 1000).toFixed(2)} kW` : 'No aplica'],
    ['Baterías', inputs.batteries > 0 ? `${inputs.batteries} ${inputs.batteries === 1 ? 'Batería' : 'Baterías'}` : 'No aplica'],
  ];
  const sumR: [string, string][] = [
    ['Financiamiento', inputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank'],
    ['Valor Cash Total', fmt(results.cashValue)],
    ['Pronto / Rebaja', inputs.manualPronto > 0 ? `-${fmt(inputs.manualPronto)}` : '—'],
    ['Balance a Financiar', fmt(results.valorFinanciado)],
  ];
  const SR = Math.max(sumL.length, sumR.length);
  const SRH = 5;

  for (let i = 0; i < SR; i++) {
    const bg: [number,number,number] = i % 2 === 0 ? LIGHTER_GRAY : WHITE;
    doc.setFillColor(...bg);
    doc.rect(M, y + i * SRH, HALF, SRH, 'F');
    doc.rect(M + HALF + 5, y + i * SRH, HALF, SRH, 'F');
    doc.setFontSize(6.8);
    if (i < sumL.length) {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
      doc.text(sumL[i][0] + ':', M + 3, y + i * SRH + SRH - 1.2);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
      doc.text(sumL[i][1], M + HALF - 3, y + i * SRH + SRH - 1.2, { align: 'right' });
    }
    if (i < sumR.length) {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
      doc.text(sumR[i][0] + ':', M + HALF + 8, y + i * SRH + SRH - 1.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(i === 3 ? BLUE : DARK));
      doc.text(sumR[i][1], M + CW - 3, y + i * SRH + SRH - 1.2, { align: 'right' });
    }
  }
  y += SR * SRH + 4;

  // ── MAIN 2-COLUMN AREA ────────────────────────────────
  const LC_W = Math.round(CW * 0.56);
  const RC_W = CW - LC_W - 5;
  const LC_X = M;
  const RC_X = M + LC_W + 5;
  let ly = y;
  let ry = y;

  // ── LEFT: SISTEMA SELECCIONADO ───────────────────────
  ly = sectionHdr(LC_X, ly, LC_W, 'SISTEMA SELECCIONADO');
  ly = subLabel(LC_X, ly, LC_W, 'ROOFING');

  const roofRows: [string, string, boolean?][] = [
    ['Plan', inputs.roofPlan],
    ['Área Total', `${inputs.roofSqft.toLocaleString('en-US')} sqft`],
  ];
  if (inputs.removalPercentage > 0) {
    roofRows.push(['Área con Remoción', `${Math.round(inputs.removalPercentage * 100)}% · ${(inputs.roofSqft * inputs.removalPercentage).toFixed(0)} sqft`]);
    roofRows.push(['Costo de Remoción', fmt(results.roofRemovalValue)]);
  }
  if (inputs.roofCashDiscount) roofRows.push(['Descuento Cash', '10%', true]);
  roofRows.push(['Valor Base Roofing', fmt(results.roofBaseValue)]);
  ly = dataRows(LC_X, ly, LC_W, roofRows);

  if (inputs.panels > 0 || inputs.batteries > 0) {
    ly = subLabel(LC_X, ly, LC_W, 'SOLAR & BATERÍAS');
    const solarR: [string, string][] = [];
    if (inputs.panels > 0) {
      solarR.push(['Placas Solares', `${inputs.panels} Placas`]);
      solarR.push(['Potencia del Sistema', `${(results.systemSize / 1000).toFixed(2)} kW`]);
    }
    if (inputs.batteries > 0) solarR.push(['Baterías de Respaldo', `${inputs.batteries} ${inputs.batteries === 1 ? 'Batería' : 'Baterías'}`]);
    if (inputs.extendedWarranty) solarR.push(['Garantía Extendida', 'Incluida']);
    ly = dataRows(LC_X, ly, LC_W, solarR);
  }

  ly = subLabel(LC_X, ly, LC_W, 'FINANCIAMIENTO');
  const finR: [string, string][] = [
    ['Entidad', inputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank'],
  ];
  if (inputs.vipDiscount) finR.push(['Descuento VIP', '5%']);
  if (inputs.existingSolarCustomer) finR.push(['Cliente Solar Existente', 'Sí']);
  if (inputs.employeeDiscountKey !== 'Ninguno') finR.push(['Descuento Empleado', inputs.employeeDiscountKey]);
  if (inputs.applyOrientalSpecialDiscount && inputs.financing === 'ORIENTAL') finR.push(['Bono Especial Oriental', '-$12,500']);
  ly = dataRows(LC_X, ly, LC_W, finR);
  ly += 3;

  // ── LEFT: DESGLOSE DE PRECIOS ─────────────────────────
  ly = sectionHdr(LC_X, ly, LC_W, 'DESGLOSE DE PRECIOS');

  const pRows: [string, string, boolean?][] = [
    ['Valor Base Roofing', fmt(results.roofBaseValue)],
  ];
  if (results.roofRemovalValue > 0) pRows.push(['Remoción de Sellado', fmt(results.roofRemovalValue)]);
  if (inputs.roofCashDiscount) pRows.push(['Descuento Cash (10%)', `-${fmt(results.roofCashDiscountValue)}`, true]);
  pRows.push(['IVU (Exento — Proyecto Completo)', fmt(results.roofIvu)]);
  if (inputs.existingSolarCustomer) pRows.push(['Desc. Cliente Solar Existente', `-${fmt(results.vipRoofingDiscount)}`, true]);
  if (inputs.panels > 0) pRows.push([`Placas Solares (${(results.systemSize / 1000).toFixed(2)} kW)`, fmt(results.solarValue)]);
  if (results.batteryValue > 0) pRows.push(['Baterías de Respaldo', fmt(results.batteryValue)]);
  if (results.solarWarrantyValue + results.batteryWarrantyValue > 0) pRows.push(['Garantías Extendidas', fmt(results.solarWarrantyValue + results.batteryWarrantyValue)]);
  if (inputs.vipDiscount) pRows.push(['Descuento VIP (5%)', `-${fmt(results.vipProjectDiscount)}`, true]);
  if (results.employeeDiscountValue > 0) pRows.push([`Desc. Empleado (${inputs.employeeDiscountKey})`, `-${fmt(results.employeeDiscountValue)}`, true]);
  ly = dataRows(LC_X, ly, LC_W, pRows);

  // Totals
  const hasPronte = inputs.manualPronto > 0;
  const totH = hasPronte ? 20 : 13;
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(LC_X, ly, LC_W, totH, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('VALOR CASH TOTAL', LC_X + 3, ly + 8);
  doc.text(fmt(results.cashValue), LC_X + LC_W - 3, ly + 8, { align: 'right' });
  if (hasPronte) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('Pronto Aportado', LC_X + 3, ly + 15);
    doc.text(`-${fmt(inputs.manualPronto)}`, LC_X + LC_W - 3, ly + 15, { align: 'right' });
  }
  ly += totH;

  // Balance banner
  doc.setFillColor(...NAVY);
  doc.roundedRect(LC_X, ly, LC_W, 9.5, 1.2, 1.2, 'F');
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.roundedRect(LC_X, ly, LC_W, 9.5, 1.2, 1.2, 'S');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE A FINANCIAR', LC_X + 4, ly + 6.5);
  doc.text(fmt(results.valorFinanciado), LC_X + LC_W - 4, ly + 6.5, { align: 'right' });
  ly += 9.5;

  // ── RIGHT: OPCIONES DE PAGO MENSUAL ──────────────────
  ry = sectionHdr(RC_X, ry, RC_W, 'OPCIONES DE PAGO MENSUAL');

  // Table header
  doc.setFillColor(...NAVY);
  doc.roundedRect(RC_X, ry, RC_W, 7, 1.2, 1.2, 'F');
  doc.setTextColor(...SKY);
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  const c1 = RC_X + 3, c2 = RC_X + 22, c3 = RC_X + 46;
  doc.text('PLAZO', c1, ry + 4.8);
  doc.text('APR', c2, ry + 4.8);
  doc.text('PAGO MENSUAL', c3, ry + 4.8);
  ry += 7;

  const PAY_H = 6.5;
  results.monthlyPayments.forEach((pay, idx) => {
    const bg: [number,number,number] = idx % 2 === 0 ? LIGHTER_GRAY : WHITE;
    doc.setFillColor(...bg);
    doc.rect(RC_X, ry, RC_W, PAY_H, 'F');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`${pay.years} años`, c1, ry + PAY_H - 1.8);
    const aprTxt = pay.maxRate
      ? `${(pay.rate * 100).toFixed(1)}-${(pay.maxRate * 100).toFixed(1)}%`
      : `${(pay.rate * 100).toFixed(2)}%`;
    doc.text(aprTxt, c2, ry + PAY_H - 1.8);
    const amtTxt = pay.maxAmount ? `${fmt(pay.amount)}` : fmt(pay.amount);
    doc.text(amtTxt, c3, ry + PAY_H - 1.8);
    ry += PAY_H;
  });

  ry += 3;

  // Balance highlight (right col)
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(RC_X, ry, RC_W, 10, 1.2, 1.2, 'F');
  doc.setFillColor(...BLUE);
  doc.roundedRect(RC_X, ry, 2.5, 10, 0.8, 0.8, 'F');
  doc.setTextColor(...NAVY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Balance a Financiar', RC_X + 6, ry + 6.5);
  doc.setTextColor(...BLUE);
  doc.setFontSize(8.5);
  doc.text(fmt(results.valorFinanciado), RC_X + RC_W - 3, ry + 6.5, { align: 'right' });
  ry += 13;

  // ── ELIGIBILITY BADGE ────────────────────────────────
  const botY = Math.max(ly, ry) + 4;
  const eligColor: [number,number,number] = results.conditionOk ? GREEN : RED;
  doc.setFillColor(...eligColor);
  doc.roundedRect(M, botY, CW, 9.5, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const eligTxt = results.conditionOk
    ? `✓ PROYECTO ELEGIBLE  |  Roofing Share: ${(results.roofShare * 100).toFixed(1)}%  |  Límite: ${(results.roofLimit * 100).toFixed(0)}%`
    : `✗ NO ELEGIBLE  |  Roofing Share: ${(results.roofShare * 100).toFixed(1)}% excede límite de ${(results.roofLimit * 100).toFixed(0)}%`;
  doc.text(eligTxt, PW / 2, botY + 6.5, { align: 'center' });

  if (!results.conditionOk && results.requiredProntoForCompliance > 0) {
    doc.setFillColor(...AMBER);
    doc.roundedRect(M, botY + 12.5, CW, 7.5, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`⚠ Para elegibilidad se requiere pronto de: ${fmt(results.requiredProntoForCompliance)}`, PW / 2, botY + 17.5, { align: 'center' });
  }

  // ── FOOTER ───────────────────────────────────────────
  const footerY = PH - 12;
  doc.setDrawColor(...SKY);
  doc.setLineWidth(0.4);
  doc.line(M, footerY - 3, PW - M, footerY - 3);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`© 2026 Windmar Home · Generado el ${date}`, M, footerY + 2);
  doc.text('787-395-7766 | LÍNEA WINDMAR HOME', PW / 2, footerY + 2, { align: 'center' });
  doc.text('Página 1 de 1', PW - M, footerY + 2, { align: 'right' });

  // ── MERGE WITH ProyectoCompleto.pdf & SAVE ────────────
  const clienteName = cliente.nombre.trim().replace(/\s+/g, '_') || 'Cliente';
  const today = new Date().toLocaleDateString('es-PR').replace(/\//g, '-');
  const fileName = `Cotizacion_Windmar_${clienteName}_${today}.pdf`;

  const quoteBytes = doc.output('arraybuffer');

  try {
    const response = await fetch('/ProyectoCompleto.pdf');
    if (!response.ok) throw new Error('No se pudo cargar ProyectoCompleto.pdf');
    const proyectoBytes = await response.arrayBuffer();

    const merged = await PDFDocument.create();
    const quotePdf = await PDFDocument.load(quoteBytes);
    const proyectoPdf = await PDFDocument.load(proyectoBytes);

    const quotePages = await merged.copyPages(quotePdf, quotePdf.getPageIndices());
    quotePages.forEach(p => merged.addPage(p));
    const proyectoPages = await merged.copyPages(proyectoPdf, proyectoPdf.getPageIndices());
    proyectoPages.forEach(p => merged.addPage(p));

    const mergedBytes = await merged.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    doc.save(fileName);
  }
}
