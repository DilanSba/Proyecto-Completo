export interface QuoteInputs {
  roofPlan: 'SILVER' | 'GOLD' | 'PLATINUM';
  roofSqft: number;
  panels: number;
  batteries: number;
  removal: boolean;
  vipDiscount: boolean;
  existingSolarCustomer: boolean;
  roofCashDiscount: boolean;
  extendedWarranty: boolean;
  financing: 'WH' | 'ORIENTAL';
  manualPronto: number;
  removalPercentage: number;
  applyOrientalSpecialDiscount: boolean;
  employeeDiscountKey: string;
  solarBundleDiscount: boolean;
  roBundleDiscount: boolean;
}

export interface QuoteResults {
  roofSubtotal: number;
  roofIvu: number;
  roofCashDiscountValue: number;
  solarValue: number;
  solarWarrantyValue: number;
  batteryValue: number;
  batteryWarrantyValue: number;
  cashValue: number;
  valorFinanciado: number;
  systemSize: number;
  monthlyPayments: MonthlyPayment[];
  roofShare: number;
  roofLimit: number;
  conditionOk: boolean;
  requiredProntoForCompliance: number;
  projectType: string;
  vipRoofingDiscount: number;
  vipProjectDiscount: number;
  employeeDiscountValue: number;
  roofBaseValue: number;
  roofRemovalValue: number;
  solarBundleDiscountValue: number;
  roBundleDiscountValue: number;
}

export interface MonthlyPayment {
  years: number;
  rate: number;
  amount: number;
  maxRate?: number;
  maxAmount?: number;
  label?: string;
}
