import { 
  PANEL_PRICES, 
  BATTERY_PRICES, 
  BATTERY_WARRANTY, 
  WH_RATES, 
  ORIENTAL_DESDE, 
  ORIENTAL_HASTA, 
  ROOF_PLAN_RATES,
  ROOF_REMOVAL_RATES,
  DEFAULT_REMOVAL_PERCENTAGE
} from '../constants';
import { QuoteInputs, QuoteResults, MonthlyPayment } from '../types';

export function pmt(annualRate: number, years: number, principal: number): number {
  if (principal <= 0) return 0;
  const rate = annualRate / 12;
  const periods = years * 12;
  if (rate === 0) return principal / periods;
  return (rate * principal) / (1 - Math.pow(1 + rate, -periods));
}

export function calculateQuote(v: QuoteInputs): QuoteResults {
  const removalPct = v.removalPercentage || 0;
  const areaConRemocion = v.roofSqft * removalPct;
  const areaSinRemocion = v.roofSqft - areaConRemocion;

  const removalRate = ROOF_REMOVAL_RATES[v.roofPlan] || 0;
  const baseRate = ROOF_PLAN_RATES[v.roofPlan] || 0;

  const roofRemovalValue = areaConRemocion * removalRate;
  const roofBaseValue = areaSinRemocion * baseRate;
  const roofSubtotal = roofRemovalValue + roofBaseValue;

  let solarValue = PANEL_PRICES[v.panels] || 0;

  // Condición especial Oriental: >= 39 placas + >= 3 baterías = -$12,500 en placas (si se selecciona)
  if (v.financing === 'ORIENTAL' && v.panels >= 39 && v.batteries >= 3 && v.applyOrientalSpecialDiscount) {
    solarValue = Math.max(0, solarValue - 12500);
  }

  const systemSize = v.panels * 410;

  const solarWarrantyValue = v.extendedWarranty ? systemSize * 0.15 : 0;
  const batteryValue = BATTERY_PRICES[v.batteries] || 0;
  const batteryWarrantyValue = v.extendedWarranty ? (BATTERY_WARRANTY[v.batteries] || 0) : 0;

  const projectType = v.batteries >= 1 ? "Roofing + Solar + Batería" : "Roofing + Solar";
  const roofLimit = v.financing === "WH" ? 0.50 : 0.30;

  // Equipment base
  const whEquipmentBase = solarValue + batteryValue + solarWarrantyValue + batteryWarrantyValue;
  const orientalEquipmentBase = solarValue + batteryValue + solarWarrantyValue + batteryWarrantyValue;

  // Roofing discounts & IVU (Exempt in full project)
  const roofIvu = 0;
  const roofCashDiscountValue = v.roofCashDiscount ? roofSubtotal * 0.10 : 0;
  const roofAfterCash = roofSubtotal - roofCashDiscountValue;
  const vipRoofingDiscount = v.existingSolarCustomer ? 1000 : 0;

  // Project base for 5% VIP calculation (Gross total before $1,000 discount)
  const whGrossTotalForVip = whEquipmentBase + roofAfterCash;
  const orientalGrossTotalForVip = orientalEquipmentBase + roofAfterCash;

  // 5% VIP general discount
  const vipProjectDiscountWH = v.vipDiscount ? whGrossTotalForVip * 0.05 : 0;
  const vipProjectDiscountOriental = v.vipDiscount ? orientalGrossTotalForVip * 0.05 : 0;

  // Employee discount mapping
  const discountMap: Record<string, number> = {
    'Consultor (10%)': 0.10,
    'Líder (15%)': 0.15,
    'Gerente (20%)': 0.20,
    'Empleado (10%)': 0.10,
    'Gerencial (15%)': 0.15,
    'Ejecutivo (20%)': 0.20,
  };
  const rate = discountMap[v.employeeDiscountKey] || 0;

  // Employee discount
  const employeeDiscountValueWH = rate > 0 ? whGrossTotalForVip * rate : 0;
  const employeeDiscountValueOriental = rate > 0 ? orientalGrossTotalForVip * rate : 0;

  // Bundle discounts (flat fixed amounts)
  const solarBundleDiscountValue = v.solarBundleDiscount ? 500 : 0;
  const roBundleDiscountValue = v.roBundleDiscount ? 1000 : 0;
  const totalBundleDiscounts = solarBundleDiscountValue + roBundleDiscountValue;

  // Final cash value (Gross - 5% Discount - Employee Discount - $1,000 Discount - Bundle Discounts)
  const whCashValue = whGrossTotalForVip - vipProjectDiscountWH - employeeDiscountValueWH - vipRoofingDiscount - totalBundleDiscounts;
  const orientalCashValue = orientalGrossTotalForVip - vipProjectDiscountOriental - employeeDiscountValueOriental - vipRoofingDiscount - totalBundleDiscounts;

  // Roofing share validation (Based on Gross values to match user's $3,059 calculation)
  const grossEquipment = v.financing === "WH" ? whEquipmentBase : orientalEquipmentBase;
  const grossTotal = roofSubtotal + grossEquipment;
  
  // The share is calculated on the financed portion of the gross roof relative to the gross total
  const currentFinancedRoof = Math.max(roofSubtotal - v.manualPronto, 0);
  const activeRoofShare = grossTotal > 0 ? currentFinancedRoof / grossTotal : 0;
  const conditionOk = activeRoofShare <= roofLimit + 0.0001;

  // Calculate required pronto for compliance: GrossRoof - (GrossTotal * Limit)
  // For 15950 roof and 27020 solar at 30% limit: 15950 - (42970 * 0.3) = 3059
  const requiredProntoForCompliance = Math.max(roofSubtotal - (grossTotal * roofLimit), 0);

  // Final financed value with manual down payment
  const activeFinancedValue = v.financing === "WH" 
    ? Math.max(whCashValue - v.manualPronto, 0)
    : Math.max(orientalCashValue - v.manualPronto, 0);

  const monthlyPayments: MonthlyPayment[] = [];
  if (v.financing === 'WH') {
    Object.entries(WH_RATES).forEach(([years, rate]) => {
      monthlyPayments.push({
        years: Number(years),
        rate,
        amount: pmt(rate, Number(years), activeFinancedValue)
      });
    });
  } else {
    Object.keys(ORIENTAL_DESDE).forEach((years) => {
      const y = Number(years);
      const desde = ORIENTAL_DESDE[y];
      const hasta = ORIENTAL_HASTA[y];
      monthlyPayments.push({
        years: y,
        rate: desde,
        amount: pmt(desde, y, activeFinancedValue),
        maxRate: hasta,
        maxAmount: pmt(hasta, y, activeFinancedValue),
        label: 'Rango'
      });
    });
  }

  return {
    roofSubtotal,
    roofIvu,
    roofCashDiscountValue,
    solarValue,
    solarWarrantyValue,
    batteryValue,
    batteryWarrantyValue,
    cashValue: v.financing === "WH" ? whCashValue : orientalCashValue,
    valorFinanciado: activeFinancedValue,
    systemSize,
    monthlyPayments,
    roofShare: activeRoofShare,
    roofLimit,
    conditionOk,
    requiredProntoForCompliance,
    projectType,
    vipRoofingDiscount,
    vipProjectDiscount: v.financing === "WH" ? vipProjectDiscountWH : vipProjectDiscountOriental,
    employeeDiscountValue: v.financing === "WH" ? employeeDiscountValueWH : employeeDiscountValueOriental,
    roofBaseValue,
    roofRemovalValue,
    solarBundleDiscountValue,
    roBundleDiscountValue
  };
}
