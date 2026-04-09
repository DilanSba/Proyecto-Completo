# Proyecto-completo-pro

Cotizador integral de alta precisión para proyectos de Roofing, Solar y Baterías con múltiples opciones de financiamiento. Diseñado específicamente para Windmar Home.

## Características

- **Cálculo de Roofing:** Soporta planes Silver, Gold y Platinum con remoción de sellado configurable.
- **Sistema Solar:** Configuración de placas solares y baterías con precios actualizados.
- **Financiamiento:** Comparativa entre WH Financial y Oriental Bank con tasas dinámicas.
- **Descuentos Especiales:**
  - Descuento VIP (5%).
  - Descuento Cliente Existente ($1,000).
  - Descuento Pago Cash Roofing (10%).
  - Oferta Especial Oriental ($12,500 para sistemas >= 39 placas + 3 baterías).
  - Descuentos para Empleados (Ventas y Admin/Operaciones).
- **Interfaz Moderna:** Diseño fluido con componentes personalizados y animaciones suaves.

## Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript, Vite.
- **Estilos:** Tailwind CSS 4.
- **Animaciones:** Motion (framer-motion).
- **Iconos:** Lucide React.
- **Backend (Opcional):** Express (para servir la aplicación).

## Instalación y Uso

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd calculadora-pro-windmar
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo `.env.example` a `.env` y completa las variables necesarias (si aplica).
   ```bash
   cp .env.example .env
   ```

4. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   ```

## Estructura del Proyecto

- `/src/App.tsx`: Componente principal y lógica de la interfaz.
- `/src/utils/calculations.ts`: Motor de cálculo de la cotización.
- `/src/constants.ts`: Precios de equipos, tasas de interés y constantes del sistema.
- `/src/types.ts`: Definiciones de tipos TypeScript.

## Licencia

Este proyecto es para uso interno de Windmar Home.
