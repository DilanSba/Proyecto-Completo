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

const NAVY: [number, number, number] = [30, 58, 138];
const BLUE: [number, number, number] = [37, 99, 235];
const LIGHT_BLUE: [number, number, number] = [219, 234, 254];
const WHITE: [number, number, number] = [255, 255, 255];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT_GRAY: [number, number, number] = [241, 245, 249];
const LIGHTER_GRAY: [number, number, number] = [248, 250, 252];
const DARK: [number, number, number] = [15, 23, 42];
const GREEN: [number, number, number] = [5, 150, 105];
const RED: [number, number, number] = [220, 38, 38];
const AMBER: [number, number, number] = [217, 119, 6];

function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

function drawPageFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number, pageNum: number, totalPages: number): void {
  const footerY = pageHeight - 14;
  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  const date = new Date().toLocaleDateString('es-PR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`© 2026 Windmar Home. Generado el ${date}`, margin, footerY + 3);
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, footerY + 3, { align: 'right' });
  doc.text('787-395-7766 | LÍNEA WINDMAR HOME', pageWidth / 2, footerY + 3, { align: 'center' });
}

function drawSectionTitle(doc: jsPDF, x: number, y: number, width: number, title: string): number {
  doc.setFillColor(...LIGHT_BLUE);
  doc.roundedRect(x, y, width, 9, 1.5, 1.5, 'F');
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.8);
  doc.line(x, y, x, y + 9);
  doc.setLineWidth(0.2);
  doc.setTextColor(...NAVY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x + 5, y + 6.2);
  return y + 13;
}

function drawInfoBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  rows: [string, string][]
): number {
  doc.setFillColor(...NAVY);
  doc.roundedRect(x, y, width, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x + 4, y + 5.5);
  y += 8;

  rows.forEach(([label, value], idx) => {
    const bg: [number, number, number] = idx % 2 === 0 ? LIGHT_GRAY : WHITE;
    doc.setFillColor(...bg);
    doc.rect(x, y, width, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label + ':', x + 4, y + 5);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(value || '—', x + width / 2 + 2, y + 5);
    y += 7;
  });

  doc.setDrawColor(...LIGHT_BLUE);
  doc.setLineWidth(0.3);
  doc.rect(x, y - rows.length * 7 - 8, width, rows.length * 7 + 8);
  return y;
}

function drawTableRows(doc: jsPDF, x: number, y: number, width: number, rows: [string, string][]): number {
  rows.forEach(([label, value], idx) => {
    const bg: [number, number, number] = idx % 2 === 0 ? LIGHTER_GRAY : WHITE;
    doc.setFillColor(...bg);
    doc.rect(x, y, width, 6.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, x + 4, y + 4.8);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + width - 4, y + 4.8, { align: 'right' });
    y += 6.5;
  });
  return y;
}

function drawPricingTable(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  rows: [string, string, boolean?][]
): number {
  rows.forEach(([label, value, isDiscount], idx) => {
    const bg: [number, number, number] = idx % 2 === 0 ? LIGHTER_GRAY : WHITE;
    doc.setFillColor(...bg);
    doc.rect(x, y, width, 6.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, x + 4, y + 4.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(isDiscount ? BLUE : DARK));
    doc.text(value, x + width - 4, y + 4.8, { align: 'right' });
    y += 6.5;
  });
  return y;
}

export async function generateQuotePDF(
  inputs: QuoteInputs,
  results: QuoteResults,
  consultor: ConsultorInfo,
  cliente: ClienteInfo
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const date = new Date().toLocaleDateString('es-PR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ─────────────── PAGE 1: PORTADA ───────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setFillColor(...BLUE);
  doc.rect(0, 52, pageWidth, 3, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WINDMAR HOME', margin, 22);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Roofing · Solar · Baterías de Alta Ingeniería', margin, 32);

  doc.setFontSize(9);
  doc.text('787-395-7766', pageWidth - margin, 22, { align: 'right' });
  doc.setFontSize(8);
  doc.text('Línea Windmar Home', pageWidth - margin, 30, { align: 'right' });

  doc.setFillColor(...BLUE);
  doc.roundedRect(margin, 42, 50, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(date, margin + 25, 46.8, { align: 'center' });

  doc.setFillColor(...BLUE);
  doc.roundedRect(margin, 62, contentWidth, 16, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN — PROYECTO COMPLETO', pageWidth / 2, 72, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(results.projectType, pageWidth / 2, 79, { align: 'center' });

  let y = 88;

  y = drawInfoBox(doc, margin, y, contentWidth, 'INFORMACIÓN DEL CONSULTOR', [
    ['Nombre', consultor.nombre],
    ['Correo Electrónico', consultor.correo],
    ['Teléfono', consultor.telefono],
  ]);

  y += 6;

  y = drawInfoBox(doc, margin, y, contentWidth, 'INFORMACIÓN DEL CLIENTE', [
    ['Nombre', cliente.nombre],
    ['Dirección', cliente.direccion],
    ['Correo Electrónico', cliente.correo],
    ['Teléfono', cliente.telefono],
  ]);

  y += 8;

  const summaryRows: [string, string][] = [
    ['Plan Roofing', inputs.roofPlan],
    ['Área Roofing', `${inputs.roofSqft.toLocaleString('en-US')} sqft`],
    ['Sistema Solar', inputs.panels > 0 ? `${inputs.panels} Placas · ${(results.systemSize / 1000).toFixed(2)} kW` : 'No aplica'],
    ['Baterías', inputs.batteries > 0 ? `${inputs.batteries} ${inputs.batteries === 1 ? 'Batería' : 'Baterías'}` : 'No aplica'],
    ['Financiamiento', inputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank'],
    ['Valor Total Cash', fmt(results.cashValue)],
    ['Balance a Financiar', fmt(results.valorFinanciado)],
  ];
  y = drawInfoBox(doc, margin, y, contentWidth, 'RESUMEN DEL PROYECTO', summaryRows);

  y += 8;

  const eligibleColor: [number, number, number] = results.conditionOk ? GREEN : RED;
  doc.setFillColor(...eligibleColor);
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const eligibleText = results.conditionOk
    ? `✓ PROYECTO ELEGIBLE  |  Roofing Share: ${(results.roofShare * 100).toFixed(1)}%  |  Límite: ${(results.roofLimit * 100).toFixed(0)}%`
    : `✗ NO ELEGIBLE  |  Roofing Share: ${(results.roofShare * 100).toFixed(1)}% excede límite de ${(results.roofLimit * 100).toFixed(0)}%`;
  doc.text(eligibleText, pageWidth / 2, y + 6, { align: 'center' });

  drawPageFooter(doc, pageWidth, pageHeight, margin, 1, 2);

  // ─────────────── PAGE 2: COTIZACIÓN DETALLADA ───────────────
  doc.addPage();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 40, pageWidth, 2.5, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('WINDMAR HOME', margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Detalle de Cotización', margin, 25);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(date, pageWidth - margin, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${cliente.nombre}`, pageWidth - margin, 24, { align: 'right' });
  doc.text(`Consultor: ${consultor.nombre}`, pageWidth - margin, 31, { align: 'right' });

  y = 50;

  y = drawSectionTitle(doc, margin, y, contentWidth, 'SISTEMA SELECCIONADO');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('ROOFING', margin + 3, y + 1);
  y += 4;

  const roofingRows: [string, string][] = [
    ['Plan', inputs.roofPlan],
    ['Área Total', `${inputs.roofSqft.toLocaleString('en-US')} sqft`],
  ];
  if (inputs.removalPercentage > 0) {
    roofingRows.push([
      'Área con Remoción',
      `${Math.round(inputs.removalPercentage * 100)}% · ${(inputs.roofSqft * inputs.removalPercentage).toLocaleString('en-US', { maximumFractionDigits: 0 })} sqft`,
    ]);
    roofingRows.push(['Costo de Remoción', fmt(results.roofRemovalValue)]);
  }
  if (inputs.roofCashDiscount) roofingRows.push(['Descuento Cash Roofing', '10%']);
  roofingRows.push(['Valor Base Roofing', fmt(results.roofBaseValue)]);

  y = drawTableRows(doc, margin, y, contentWidth, roofingRows);
  y += 5;

  if (inputs.panels > 0 || inputs.batteries > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('SISTEMA SOLAR & BATERÍAS', margin + 3, y + 1);
    y += 4;

    const solarRows: [string, string][] = [];
    if (inputs.panels > 0) {
      solarRows.push(['Placas Solares', `${inputs.panels} Placas`]);
      solarRows.push(['Potencia del Sistema', `${(results.systemSize / 1000).toFixed(2)} kW`]);
    }
    if (inputs.batteries > 0) {
      solarRows.push(['Baterías de Respaldo', `${inputs.batteries} ${inputs.batteries === 1 ? 'Batería' : 'Baterías'}`]);
    }
    if (inputs.extendedWarranty) {
      solarRows.push(['Garantía Extendida', 'Incluida']);
    }
    y = drawTableRows(doc, margin, y, contentWidth, solarRows);
    y += 5;
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text('FINANCIAMIENTO', margin + 3, y + 1);
  y += 4;
  const financingRows: [string, string][] = [
    ['Entidad', inputs.financing === 'WH' ? 'WH Financial' : 'Oriental Bank'],
  ];
  if (inputs.vipDiscount) financingRows.push(['Descuento VIP', '5%']);
  if (inputs.existingSolarCustomer) financingRows.push(['Cliente Solar Existente', 'Sí']);
  if (inputs.employeeDiscountKey !== 'Ninguno') financingRows.push(['Descuento Empleado', inputs.employeeDiscountKey]);
  if (inputs.applyOrientalSpecialDiscount && inputs.financing === 'ORIENTAL') {
    financingRows.push(['Bono Especial Oriental', '-$12,500']);
  }
  y = drawTableRows(doc, margin, y, contentWidth, financingRows);
  y += 6;

  y = drawSectionTitle(doc, margin, y, contentWidth, 'DESGLOSE DE PRECIOS');

  const pricingRows: [string, string, boolean?][] = [
    ['Valor Base Roofing', fmt(results.roofBaseValue)],
  ];
  if (results.roofRemovalValue > 0) pricingRows.push(['Remoción de Sellado', fmt(results.roofRemovalValue)]);
  if (inputs.roofCashDiscount) pricingRows.push([`Descuento Pago Cash (10%)`, `-${fmt(results.roofCashDiscountValue)}`, true]);
  pricingRows.push(['IVU (Exento — Proyecto Completo)', fmt(results.roofIvu)]);
  if (inputs.existingSolarCustomer) pricingRows.push(['Descuento Cliente Solar Existente', `-${fmt(results.vipRoofingDiscount)}`, true]);
  if (inputs.panels > 0) pricingRows.push([`Placas Solares (${(results.systemSize / 1000).toFixed(2)} kW)`, fmt(results.solarValue)]);
  if (results.batteryValue > 0) pricingRows.push(['Baterías de Respaldo', fmt(results.batteryValue)]);
  if (results.solarWarrantyValue + results.batteryWarrantyValue > 0) {
    pricingRows.push(['Garantías Extendidas', fmt(results.solarWarrantyValue + results.batteryWarrantyValue)]);
  }
  if (inputs.vipDiscount) pricingRows.push(['Descuento VIP (5%)', `-${fmt(results.vipProjectDiscount)}`, true]);
  if (results.employeeDiscountValue > 0) {
    pricingRows.push([`Descuento Empleado (${inputs.employeeDiscountKey})`, `-${fmt(results.employeeDiscountValue)}`, true]);
  }

  y = drawPricingTable(doc, margin, y, contentWidth, pricingRows);
  y += 3;

  const hasPronte = inputs.manualPronto > 0;
  const totalsH = hasPronte ? 24 : 18;
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(margin, y, contentWidth, totalsH, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text('VALOR CASH TOTAL', margin + 4, y + 7);
  doc.text(fmt(results.cashValue), pageWidth - margin - 4, y + 7, { align: 'right' });

  if (hasPronte) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Pronto Aportado', margin + 4, y + 15);
    doc.text(`-${fmt(inputs.manualPronto)}`, pageWidth - margin - 4, y + 15, { align: 'right' });
  }

  y += totalsH;
  doc.setFillColor(...NAVY);
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE A FINANCIAR', margin + 4, y + 7);
  doc.text(fmt(results.valorFinanciado), pageWidth - margin - 4, y + 7, { align: 'right' });
  y += 15;

  y = drawSectionTitle(doc, margin, y, contentWidth, 'OPCIONES DE PAGO MENSUAL');

  const colPlazo = margin + 4;
  const colApr = margin + 30;
  const colPago = margin + 85;
  const colOpcion = margin + 145;

  doc.setFillColor(...BLUE);
  doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAZO', colPlazo, y + 5.5);
  doc.text('APR', colApr, y + 5.5);
  doc.text('PAGO MENSUAL', colPago, y + 5.5);
  doc.text('OPCIÓN', colOpcion, y + 5.5);
  y += 8;

  results.monthlyPayments.forEach((pay, idx) => {
    const bg: [number, number, number] = idx % 2 === 0 ? LIGHTER_GRAY : WHITE;
    doc.setFillColor(...bg);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.text(`${pay.years} años`, colPlazo, y + 5.5);

    const aprTxt = pay.maxRate
      ? `${(pay.rate * 100).toFixed(2)}% – ${(pay.maxRate * 100).toFixed(2)}%`
      : `${(pay.rate * 100).toFixed(2)}%`;
    doc.text(aprTxt, colApr, y + 5.5);

    const amtTxt = pay.maxAmount
      ? `${fmt(pay.amount)} – ${fmt(pay.maxAmount)}`
      : fmt(pay.amount);
    doc.text(amtTxt, colPago, y + 5.5);

    doc.text(pay.label || 'Estándar', colOpcion, y + 5.5);
    y += 8;
  });

  y += 5;

  const badgeColor: [number, number, number] = results.conditionOk ? GREEN : RED;
  doc.setFillColor(...badgeColor);
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  const badgeTxt = results.conditionOk
    ? `✓ PROYECTO ELEGIBLE  |  Roofing Share: ${(results.roofShare * 100).toFixed(1)}%  |  Límite: ${(results.roofLimit * 100).toFixed(0)}%`
    : `✗ NO ELEGIBLE  |  Roofing Share: ${(results.roofShare * 100).toFixed(1)}% excede límite de ${(results.roofLimit * 100).toFixed(0)}%`;
  doc.text(badgeTxt, pageWidth / 2, y + 6, { align: 'center' });

  if (!results.conditionOk && results.requiredProntoForCompliance > 0) {
    y += 12;
    doc.setFillColor(...AMBER);
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `⚠ Para elegibilidad se requiere pronto de: ${fmt(results.requiredProntoForCompliance)}`,
      pageWidth / 2,
      y + 5.5,
      { align: 'center' }
    );
  }

  drawPageFooter(doc, pageWidth, pageHeight, margin, 2, 2);

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
