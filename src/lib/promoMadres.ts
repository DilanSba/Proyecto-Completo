/**
 * Promo Mes de las Madres 2026 + Farmacias — Proyecto Completo
 *
 * Reglas extraídas del comunicado oficial (José Alicea, 04/30/2026):
 *
 * MADRES — ROOFING
 *   - Platinum al precio de Gold
 *   - 15% descuento equivalente · ahorros que superan los $3,000
 *
 * MADRES — SOLAR (paneles o paneles + batería)
 *   - 4 a 5 kW:  $500 (descuento WHF / Cash)
 *   - 5 kW+:     $1,000
 *
 * FARMACIAS — ROOFING
 *   - 10% descuento sobre el total de roofing
 *   - Sistemas entre 5 kW y 35 kW (alineado con el cotizador-loan)
 *
 * Vigencia general:
 *   - Anuncia desde: 1 de mayo 2026
 *   - Vender solo del: 7 al 14 de mayo 2026
 *   - Solo en showroom (Roosevelt, Mayagüez, Ponce, Hatillo)
 */

const ANNOUNCE_START = new Date('2026-05-01T00:00:00');
const SALE_START     = new Date('2026-05-07T00:00:00');
const SALE_END       = new Date('2026-05-14T23:59:59');

/** ¿Hay que mostrar el banner promo? (1 al 14 de mayo) */
export function isMadresAnnounceActive(now: Date = new Date()): boolean {
  return now >= ANNOUNCE_START && now <= SALE_END;
}

/** ¿Se puede APLICAR el descuento? (7 al 14 de mayo) */
export function isMadresSaleActive(now: Date = new Date()): boolean {
  return now >= SALE_START && now <= SALE_END;
}

/** Rango kW para promo Farmacias */
export const FARMACIAS_KW_MIN = 5;
export const FARMACIAS_KW_MAX = 35;
