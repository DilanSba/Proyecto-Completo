# CAMBIOS · JNSBSTN — Proyecto Completo

Resumen completo de cambios aplicados en la rama `feature/unify-pdf-modal`.

**Autor:** Juan Sebastián Rivera Joven
**Rama:** `feature/unify-pdf-modal`
**Base:** `main`
**Fecha:** mayo de 2026
**Tipo de cotizador:** Calculadora full-stack (Roofing + Solar + Batería) con backend Express + SQLite

---

## 1. Stack y limpieza general

### Estado del backend
- `server.ts` (Express + better-sqlite3) **se preservó intacto**. Sigue corriendo en `npm run dev`.
- Port hardcoded `3000` → `Number(process.env.PORT) || 3003` para no chocar con `cotizador-agua` o `calculador-anker` corriendo en paralelo en dev.

### Lo que NO se tocó
- `src/utils/calculations.ts` salvo para integrar las 4 promociones nuevas.
- `src/utils/pdfGenerator.ts` core lógico — solo se cambió header / footer y la paleta light/dark.
- La grilla principal con inputs (col 1) y resultados (col 2) en `App.tsx`.

---

## 2. Header (nuevo componente `src/components/Header.tsx`)

- **Logo Windmar** grande (`h-16 md:h-20 lg:h-24`) + título "Cotizador Proyecto Completo" + subtítulo "Roofing · Solar · Baterías".
- Toggle de tema **patrón roofing-pro** (Sun/Moon Lucide + chip "TEMA · Claro/Oscuro" + spring rotation).
- Bloque derecho: **787-395-7766** dorado + Línea Windmar Home + Telemercadeo 811 / Ventas 839.
- Sticky top con `backdrop-blur-md` y borde inferior windmar-blue-light.

---

## 3. Footer (nuevo componente `src/components/Footer.tsx`)

3 columnas con íconos al estilo roofing-pro:
1. 🛡 **Garantía Integral** (Battery icon, color anker-blue) — antes era texto.
2. 💳 **Financiamiento Flexible** — WH Financial, Oriental, cash, descuentos.
3. 🔧 **Soporte Local** — Línea Windmar Home · 787-395-7766 · Telemercadeo · Ventas.

Copyright al final: `© 2026 Windmar Home · Todos los derechos reservados`.

---

## 4. Selector de financiamiento WH Financial vs Oriental Bank

**Antes:** segmented control con texto plano "WH Financial" / "Oriental".

**Ahora:** 2 cards lado a lado con **logos oficiales** + check cuando seleccionado.
- WH activo → borde + acento azul Windmar `#1D429B`.
- Oriental activo → borde + acento dorado Windmar `#F89B24`.
- URLs de logos copiadas directo de `cotizador-loan`:
  - `WH_LOGO_URL` → digifi sales branding
  - `ORIENTAL_LOGO_URL` → orientalbank.com themes oficial

---

## 5. PDFModal (`src/components/PDFModal.tsx`) — totalmente reescrito

Estilo coherente con water/anker (tema claro Windmar, sin azul-cyan Anker). El modal vive ahora como componente separado, no inline en `App.tsx`.

### Estructura
- Header blanco con **título negro** + icono `FileText` azul + **toggle ES/EN** + close.
- Cada sección dentro de su propia **card** con fondo `#f8fafc` + borde gris + radius 12.
- Líneas debajo de cada título → **azul Windmar oscuro** (no más naranja).
- Inputs con borde sutil y texto negro.

### Secciones del modal
1. **Planes de Sellado** (multi-select):
   - SILVER → gris
   - GOLD → dorado Windmar
   - PLATINUM → navy oscuro Windmar
   - Selección visual con `CheckCircle2` cuando activa.
   - Muestra `$X.XX/sqft` debajo del nombre.
2. **🎁 Promociones Disponibles** (nuevo, ver §6).
3. **Datos del Cliente** (4 campos).
4. **Datos del Consultor** (3 campos).
5. **Botones**: Cancelar (outline) + Descargar/Generar Comparativa PDF (azul Windmar, mayúsculas con letterspacing).

---

## 6. Promociones disponibles (nuevo)

Acordeón colapsable con **4 promo cards en grilla responsive** (`auto-fit minmax(180px, 1fr)`). Lógica de vigencia en `src/lib/promoMadres.ts`:

```typescript
isMadresAnnounceActive() // 1-14 mayo 2026 — banner visible
isMadresSaleActive()     // 7-14 mayo 2026 — checkboxes habilitables
```

### Cards (las 4 son independientes y combinables)

| Promo | Color | Descripción | Cálculo |
|---|---|---|---|
| **🏠 ♥ Madres — Roofing** | Rosa `#E84F97` | Platinum a precio de Gold | `discount = platinumTotal − goldTotal` sobre el área |
| **☀️ ♥ Madres — Solar** | Rosa `#E84F97` | $500 si 4-5 kW · $1,000 si 5+ kW | Aplicado al `solarValue` directo |
| **💊 ⚕ Farmacias — Roofing** | Verde `#0F9D58` | 10% sobre roofing total | Aplicado al `roofSubtotal` |
| **💊 ⚕ Farmacias — Solar** | Verde `#0F9D58` | 10% sobre paneles solares | Aplicado al `solarValue` (después de Madres si activa) |

Cada card muestra el **ahorro en vivo** en verde cuando está marcada (`results.X_DiscountValue`).

Cuando la ventana de Madres ya cerró (después del 14 mayo), solo se muestran las 2 cards de Farmacias en una sección compacta.

### Sincronización
- Las flags viven en `inputs` (parte del state principal de la app).
- `calculations.ts` aplica los descuentos al cálculo real.
- El PDF descargado ya muestra los **precios reducidos** automáticamente.

---

## 7. PDF generator (`src/utils/pdfGenerator.ts`)

### PDF siempre en tema claro
- Antes: pasaba `isDarkMode` al PDF generator → el PDF cambiaba a tema oscuro cuando la app estaba en dark mode.
- Ahora: `handleDownloadPDF` siempre llama con `PDF_FORCE_LIGHT = false`.
- El PDF **no cambia de aspecto** aunque la app esté en dark mode.

### Texto negro (per request)
- `textPrimary`: `[35, 31, 32]` → `[0, 0, 0]` (negro puro).
- `textLabel`: `[29, 66, 155]` (azul) → `[60, 60, 60]` (gris oscuro casi negro).
- Los azules y naranjas quedan solo como acentos en headers, footer, badges — el cuerpo del PDF es todo negro.

### Header estilo loan/lease
- **Antes:** orange strip thin + logo + texto derecho con info de contacto. Fondo blanco/page bg.
- **Ahora:**
  - Barra navy `#21274e` de 22mm de alto cubriendo todo el ancho.
  - Acento naranja: strip 2mm debajo del navy + stripe vertical 1.5mm a la izquierda.
  - Logo Windmar en **pill blanco** (rounded rect blanco) a la izquierda para que destaque.
  - Título central "WINDMAR PROYECTO COMPLETO" + subtítulo "ROOFING · SOLAR · BATERÍAS DE ALTA INGENIERÍA" en naranja.
  - Derecha: 787-395-7766 en blanco bold + Línea Windmar Home en azul claro + fecha en blanco.

### Footer 3 columnas estilo loan/lease
- **Antes:** simple barra navy con copyright + teléfono centrados + "Página 2" derecha.
- **Ahora:**
  - Barra navy `#21274e` de 22mm de alto al fondo.
  - Acento naranja 1.5mm arriba + stripe vertical 1.5mm izq.
  - **3 columnas con separadores verticales gris claro:**
    1. Logo Windmar (pill blanco) + texto "WINDMAR HOME".
    2. **Contáctanos**: ventas@windmarhome.com · 787-395-7766 · Telemercadeo 811 / Ventas 839.
    3. **Dirección**: 1255 Avenida F.D. Roosevelt · San Juan, 00920, PR · fecha de cotización.

---

## 8. Tipos y cálculos — `types.ts` + `calculations.ts`

### Nuevos campos en `QuoteInputs`
```typescript
promoMadresRoofing: boolean;
promoMadresSolar: boolean;
promoFarmaciasRoofing: boolean;
promoFarmaciasSolar: boolean;
```

### Nuevos campos en `QuoteResults`
```typescript
madresRoofingDiscountValue: number;
madresSolarDiscountValue: number;
farmaciasRoofingDiscountValue: number;
farmaciasSolarDiscountValue: number;
```

### Lógica en `calculateQuote()`
Orden de aplicación (importante para que los descuentos compuestos cuadren):

1. **Madres Roofing** (si PLATINUM seleccionado): swap tarifa Platinum por Gold. Discount = diferencia.
2. **Farmacias Roofing**: 10% al roofSubtotal post-Madres.
3. **Oriental Special** (existente): -$12,500 en placas si ≥39 paneles + ≥3 baterías.
4. **Madres Solar**: $500 (4-5 kW) o $1000 (5+ kW) restado a `solarValue`.
5. **Farmacias Solar**: 10% sobre `solarValue` post-Madres Solar.

---

## 9. CSS / tema (`src/index.css`)

- Eliminado el hack viejo `body.dark-mode-active { filter: invert(1) hue-rotate(180deg) }`.
- Implementado patrón Tailwind 4 estándar: `@custom-variant dark` + clase `.dark` en `<html>`.
- Tokens windmar-blue, windmar-blue-light, windmar-blue-dark, windmar-gold definidos en `@theme`.
- Background gradients sutiles azul + dorado.
- `.glass-card` utility + `.shadow-premium`.

### Dark mode wiring en App.tsx
- `useState(() => localStorage.getItem('wh-theme') === 'dark')` para persistencia.
- `useEffect` que sincroniza la clase `.dark` en `document.documentElement` con el state.

---

## 10. Archivos

### Nuevos
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/PDFModal.tsx`
- `src/lib/promoMadres.ts`
- `CAMBIOS-JNSBSTN-README.md` (este archivo)

### Modificados
- `src/App.tsx` — extracción de Header/Footer/PDFModal inline, state de promos, dark mode pattern, financing toggle con logos.
- `src/index.css` — paleta Windmar + dark mode real.
- `src/types.ts` — 4 flags de promo + 4 fields de descuento.
- `src/utils/calculations.ts` — aplicación de las 4 promociones.
- `src/utils/pdfGenerator.ts` — header/footer estilo loan/lease + tema claro forzado + texto negro.
- `server.ts` — port configurable vía env.

### NO eliminados (decisión de mantener funcionalidad)
- `server.ts`, `quotes.db`, deps Express + SQLite, `vercel.json`. El backend se preserva aunque no esté siendo deployado actualmente.

---

## 11. Pendientes / observaciones

1. **Migración del PDF a `@react-pdf/renderer`**: el `pdfGenerator.ts` actual (852 líneas) sigue siendo jsPDF imperativo. Migrar a `@react-pdf/renderer` declarativo es la "fase 2" pendiente — sería consistente con water y anker. Permitiría además aplicar el "banner promo" como elemento visual rico (no solo precios reducidos).
2. **Backend Express + SQLite**: en producción, Vercel no corre Express tradicional. Decisión pendiente:
   - Eliminar el backend (front-only, deploy directo).
   - Migrar a Vercel Serverless Functions.
   - Hostearlo aparte (Railway/Render).
3. **Promo Tesla rebate Powerwall** del comunicado: no implementada todavía. Pendiente.

---

## Comandos para probar localmente

```powershell
cd "C:\dev\Call Center\Proyecto-Completo"
npm install
npm run dev            # → http://localhost:3003 (port configurable con PORT env)
npm run build          # producción
```

Para correr el PDF con descuentos: configura plan Platinum + 20 paneles ≥5 kW + cualquier área. Marca las 4 promos en el modal. El PDF descargado muestra los precios con los descuentos aplicados automáticamente.
