# FondTracker 2.0 · Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar toda la plataforma con la identidad "Mezcla 2" y terminar las funciones a medias (panel modular, movimientos, evolución real del patrimonio, alta honesta de fondos).

**Architecture:** Casi todos los componentes ya pintan con variables CSS (`--color-ink-*`, `--color-fg-*`, `--color-accent`…) definidas en `src/client/styles.css`; el rediseño empieza re-tokenizando ahí y añadiendo primitivas UI compartidas, y luego repasa pantalla por pantalla. Las funciones a medias se completan conectando código que ya existe (componentes en `components/dashboard/`, `server/transactions.ts`) con las piezas que faltan en `db.ts`, `index.ts` y `api.ts`.

**Tech Stack:** Bun 1.3, React 19, Tailwind 4 (`@theme`), Recharts, lucide-react, mysql2 → TiDB Cloud, `bun test`.

**Spec:** `docs/superpowers/specs/2026-10-18-fondtracker-2-design.md`

## Global Constraints

- Trabajar en `C:\Users\Ruben\Desktop\FondTracker` (Rubén mira `http://localhost:3741` en directo). Nada se sube a GitHub/Render sin su aprobación tras ver capturas.
- Paleta oscura: fondo `#0b0b0a` con grano + resplandor violeta superior; superficie `rgba(255,255,255,.035)`, borde `rgba(255,255,255,.07)`, radio ~18 px; acento degradado `#e3b25b → #c084fc`; etiqueta `rgba(129,140,248,.14)` / texto `#c7d2fe`; botón principal `#f2efe8` sobre texto `#0b0b0a`, forma píldora.
- Tipografía: Space Grotesk (titulares y cifras), Inter (texto), JetBrains Mono (etiquetas, ISIN, datos técnicos). Cargadas desde Google Fonts (CSP ya permite `fonts.googleapis.com` / `fonts.gstatic.com`).
- Verde/rojo solo para ganancia/pérdida (`--color-profit`, `--color-loss`).
- Sin datos inventados en ninguna pantalla; sin métricas que no se calculen (TWR/XIRR fuera).
- Esquema de BD solo aditivo, desde `ensureSchema()`; tablas con `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`; nada de `FULLTEXT` obligatorio.
- Móvil ≥ 360 px sin scroll horizontal.
- Textos en español.
- **Todo cálculo contable lleva tests unitarios** (petición de Rubén): invertido, valor, ganancia/pérdida en € y %, totales de cartera, PMP y ganancia realizada, movimientos, historial/reconstrucción, distribución por entidad/categoría, simulador IRPF, y formatos de dinero/porcentaje. Ningún cálculo de dinero vive dentro de un componente React: va en una función pura con su test. Casos mínimos por función: caso normal con cifras reales de Rubén, cero/vacío, valores nulos o sin precio, negativos (pérdidas) y redondeo a céntimos.

## Review Focus

1. **Usuario sin fondos** (cartera vacía): cada pantalla del panel debe mostrar un estado vacío útil, no gráficos rotos ni `NaN €`. → tests en Task 6 y Task 7.
2. **Fondo sin precio** (`current_price = null`): se ve "sin precio" con la fecha del último dato; la ganancia no se inventa. → test en Task 7.
3. **Inversión existente sin movimientos** al activar Movimientos: debe convertirse en una compra inicial con sus participaciones y precio exactos, sin cambiar el valor mostrado. → test en Task 8.
4. **Venta de más participaciones de las que hay**: se rechaza con mensaje claro. → test en Task 8.
5. **Modo claro**: todas las pantallas legibles (contraste) con la nueva paleta. → verificación en Task 1 y Task 11.

---

### Task 0: Punto de partida seguro

**Files:**
- Create: `.gitignore` entry `.superpowers/` (añadir línea)
- Modify: `.env` (solo local)

- [ ] **Step 1:** `git init` en la carpeta, primer commit con todo tal cual ("baseline antes de 2.0"). Solo local, sin remoto.
- [ ] **Step 2:** En `.env` local comentar `NODE_ENV=production` (rompe cookies en `http://localhost`). Arrancar `bun --hot src/server/index.ts` y comprobar `curl http://localhost:3741/api/health` → `{"ok":true…}` y login con el usuario de Rubén en el navegador.
- [ ] **Step 3:** Guardar línea base: `bunx tsc --noEmit -p . 2>&1 | grep -c "error TS"` (hoy ≈ 80) y `bun test` (anotar resultado).
- [ ] **Step 4:** Crear `scripts/screens.mjs` (playwright-core + Chrome del sistema, headless) que hace login y guarda capturas de landing, login, registro, legal y cada sección del panel en `.superpowers/screens/<fecha>/`. Se usará en cada tarea para enseñar capturas a Rubén.
- [ ] **Step 5:** Commit.

### Task 1: Sistema visual (tokens, fuentes, fondo)

**Files:**
- Modify: `src/client/styles.css` (`@theme`, `:root`, bloque `html[data-theme="light"]`, utilidades `.glass-card`, `.grid-overlay`, `.text-glow`)
- Modify: `src/client/index.html` (fuentes Google)
- Modify: todos los `.tsx` con `#39ff88`, `bg-[#39ff88]`, `text-[#39ff88]`, `emerald-*` usado como acento (≈140 apariciones)

**Interfaces:**
- Produces tokens: `--color-ink-0..5`, `--color-fg-1..4`, `--color-accent` (`#c084fc`), `--color-accent-2` (`#e3b25b`), `--gradient-accent` (`linear-gradient(90deg,#e3b25b,#c084fc)`), `--color-surface`, `--color-border`, `--radius-card: 18px`, `--font-heading: "Space Grotesk"`, `--font-sans: "Inter"`, `--font-mono: "JetBrains Mono"`, `--color-profit`, `--color-loss`. Clases utilitarias: `.ft-bg` (grano + resplandor), `.ft-card`, `.ft-gradient-text`.

- [ ] **Step 1:** Redefinir tokens oscuros con los valores de Global Constraints; versión clara: fondo `#f7f5f0`, superficie `#ffffff`, texto `#14130f`, acento `#7c3aed`, acento-2 `#b7791f`, profit `#15803d`, loss `#dc2626`.
- [ ] **Step 2:** Sustituir colores fijos de acento por tokens; donde `emerald-*` signifique ganancia → `var(--color-profit)`.
- [ ] **Step 3:** Verificar: `grep -rn "39ff88" src/client` → 0 resultados; `bun run build` sin errores.
- [ ] **Step 4:** Capturas (oscuro y claro) con `scripts/screens.mjs`; enseñar a Rubén. Commit.

### Task 2: Primitivas UI compartidas

**Files:**
- Create: `src/client/components/ui/Button.tsx`, `Card.tsx`, `Tag.tsx`, `Stat.tsx`, `PageHeader.tsx`, `EmptyState.tsx`, `index.ts`
- Test: `src/client/utils.test.ts` (no hay librería de test de DOM instalada; se prueban funciones puras)

**Interfaces:**
- Produces:
  - `Button({ variant: "primary"|"ghost"|"danger", size?: "sm"|"md", ...ButtonHTMLAttributes })`
  - `Card({ as?, padded?: boolean, className?, children })`
  - `Tag({ tone?: "accent"|"neutral"|"profit"|"loss", children })`
  - `Stat({ label: string, value: string, delta?: { value: string, positive: boolean } })`
  - `PageHeader({ title: string, subtitle?: string, actions?: ReactNode })`
  - `EmptyState({ icon: LucideIcon, title: string, text: string, action?: ReactNode })`
  - `formatEur(n: number): string` y `formatPct(n: number): string` en `src/client/utils.ts` (formato `es-ES`, 2 decimales, signo en pct; `NaN`/`Infinity` → `"—"`)

- [ ] **Step 1:** Test `formatEur(1755.22) === "1.755,22 €"`, `formatPct(14.74) === "+14,74 %"`, `formatEur(NaN) === "—"`, `formatPct(-1.12) === "-1,12 %"`.
- [ ] **Step 2:** `bun test src/client/utils.test.ts` → FAIL.
- [ ] **Step 3:** Implementar formatos y componentes.
- [ ] **Step 4:** `bun test` → PASS. Commit.

### Task 3: Landing

**Files:**
- Modify: `src/client/components/LandingPage.tsx`

- [ ] **Step 1:** Rehacer secciones: hero (titular "Todo tu dinero, en una sola vista." con `ft-gradient-text`, CTA píldora "Crear cuenta gratis" + "Entrar"), captura real del panel (imagen generada con `scripts/screens.mjs`, guardada en `public/`), qué hace (fondos/ETFs, WhatsApp, informes, fiscalidad traspasos), cómo funciona (3 pasos), FAQ, CTA final, footer.
- [ ] **Step 2:** Quitar: cifras de ejemplo inventadas (`124.562,00 €`, `+18.420 €`), "TWR", "XIRR", "+490 fondos" (usar el número real del catálogo vía `/api/banks` o texto sin número), "precisión institucional".
- [ ] **Step 3:** Verificar que todas las secciones se ven sin depender de animación por scroll (en la captura full-page actual salen bloques negros vacíos).
- [ ] **Step 4:** Capturas escritorio + móvil 390 px; enseñar. Commit.

### Task 4: Login, registro y legal

**Files:**
- Modify: `src/client/components/LoginPage.tsx`, `RegisterPage.tsx`, `LegalPage.tsx`

- [ ] **Step 1:** Rediseñar con `Card`, `Button`, `Tag`; mantener intactos los flujos (email/contraseña, Google, GitHub, errores).
- [ ] **Step 2:** Verificar login real en localhost con el usuario de Rubén y que Google/GitHub siguen redirigiendo.
- [ ] **Step 3:** Capturas; enseñar. Commit.

### Task 5: Carcasa del panel (navegación modular)

**Files:**
- Modify: `src/client/components/UserDashboard.tsx` (pasa a ser solo carcasa: sesión, sección activa, layout)
- Modify: `src/client/components/dashboard/DashboardNav.tsx`, `SettingsModal.tsx`
- Modify: `src/client/hooks/usePortfolio.ts`

**Interfaces:**
- Consumes: `DashboardSection` de `DashboardNav.tsx`.
- Produces: `usePortfolio(autoRefreshIntervalMs?: number): { funds: Investment[]; status: Status | null; loading: boolean; error: string | null; refresh(): Promise<void> }` — única fuente de datos de cartera para todas las pestañas.

- [ ] **Step 1:** El título de cada pantalla = etiqueta del menú: Resumen, Mi cartera, Añadir fondo, Análisis, WhatsApp, Informes, Admin, API.
- [ ] **Step 2:** Usar `DashboardNav` (escritorio lateral + móvil inferior/cajón) y `SettingsModal` en vez del código duplicado dentro de `UserDashboard.tsx`; el teléfono en tarjetas se enmascara: `+34 ••• ••• 965`.
- [ ] **Step 3:** `bunx tsc --noEmit` sin errores nuevos en estos archivos; navegación probada a mano en las 8 secciones. Capturas. Commit.

### Task 6: Historial diario del patrimonio (servidor)

**Files:**
- Modify: `src/server/db.ts` (tabla + consultas), `src/server/index.ts` (ruta + tarea diaria)
- Create: `src/server/history.ts`
- Test: `src/server/tests/history.test.ts`

**Interfaces:**
- Produces:
  - Tabla `portfolio_snapshots (user_id INT, snap_date DATE, invested DECIMAL(15,2), value DECIMAL(15,2), PRIMARY KEY (user_id, snap_date))`.
  - `queries.upsertSnapshot(userId: number, date: string, invested: number, value: number): Promise<void>`
  - `queries.listSnapshots(userId: number, fromDate: string): Promise<{ snap_date: string; invested: number; value: number }[]>`
  - `reconstructHistory(investments: InvestmentRow[], quotesByIsin: Map<string, YahooQuote[]>, from: Date, to: Date): { date: string; invested: number; value: number }[]` (pura, en `history.ts`): para cada fecha de cotización disponible, suma `shares × close` de las inversiones con `purchase_date <= fecha`; `invested` = suma de `shares × purchase_price` de esas mismas.
  - `GET /api/portfolio/history?range=1m|3m|6m|1y|max` → `{ points: { date: string; invested: number; value: number }[]; source: "snapshots" | "reconstructed" | "mixed" }`
  - Foto diaria: al cerrar el día (reutilizar el `setInterval` del digest) guardar `upsertSnapshot` para cada usuario.

- [ ] **Step 1:** Tests de `reconstructHistory`: cartera vacía → `[]`; una inversión comprada el 2025-07-15 con quotes mensuales → no hay puntos antes de esa fecha y el último punto vale `shares × último close`; dos inversiones con fechas distintas suman solo las activas.
- [ ] **Step 2:** `bun test src/server/tests/history.test.ts` → FAIL. **Step 3:** implementar. **Step 4:** PASS.
- [ ] **Step 5:** `curl` autenticado a `/api/portfolio/history?range=1y` en localhost devuelve puntos crecientes coherentes con la cartera de Rubén. Commit.

### Task 7: Resumen y Mi cartera (rediseño + datos honestos)

**Files:**
- Modify: `src/client/components/dashboard/OverviewTab.tsx`, `PortfolioTab.tsx`, `src/client/components/FundCard.tsx`
- Create: `src/client/fundView.ts`
- Test: `src/client/fundView.test.ts`

**Interfaces:**
- Consumes: `usePortfolio` (Task 5), `GET /api/portfolio/history` (Task 6), primitivas (Task 2).
- Produces: `fundView(fund: Investment): { hasPrice: boolean; priceLabel: string; plLabel: string | null; plPositive: boolean | null; navDateLabel: string | null; stale: boolean }` y `chartRangesFor(source: "yahoo" | "quefondos" | undefined): string[]` en `src/client/fundView.ts`. `OverviewTab`, `PortfolioTab` y `FundCard` pintan solo a través de estas funciones; con `funds.length === 0` muestran `EmptyState` (acción "Añadir fondo") y ningún gráfico.

- [ ] **Step 1:** Tests: fondo con `current_price: null` → `hasPrice false`, `priceLabel "Sin precio"`, `plLabel null`; fondo de Rubén (66,893659 × 18,408775, invertido 1.000) → `plLabel "+231,43 €"`, `plPositive true`; `chartRangesFor("quefondos")` → `["6M","1A","3A","5A","Máx"]`; `chartRangesFor("yahoo")` incluye `"1M"`.
- [ ] **Step 2:** FAIL → implementar → PASS.
- [ ] **Step 3:** Gráfico de evolución con dos series (valor e invertido) desde `/api/portfolio/history`; eje Y sin etiquetas repetidas (formato compacto `1,2 k €` con 1 decimal).
- [ ] **Step 4:** En cada fondo: "NAV 18,41 € · 14 oct" y aviso si `isStale`. Rangos de gráfico: si la fuente es `quefondos` (mensual) ocultar 1D/5D/1M y mostrar 6M/1A/3A/5A/Máx.
- [ ] **Step 5:** Capturas; enseñar. Commit.

### Task 8: Movimientos (aportaciones, ventas, traspasos)

**Files:**
- Modify: `src/server/db.ts`, `src/server/index.ts` (registrar `transactionRoutes`), `src/client/api.ts`, `src/client/components/dashboard/DcaTransactionsModal.tsx`
- Test: `src/server/tests/transactions.test.ts` (ampliar)

**Interfaces:**
- Consumes: `calculatePmp`, `addTransaction`, `deleteTransaction`, `listFundTransactions` ya escritos en `src/server/transactions.ts`; rutas en `src/server/routes/transactions.routes.ts`.
- Produces (en `db.ts`):
  - `export type TransactionType = "BUY" | "SELL" | "TRANSFER_IN" | "TRANSFER_OUT"`
  - `export type TransactionRow = { id: number; user_id: number; fund_id: number; type: TransactionType; shares: number; price: number; amount: number; date: string; fees: number; notes: string | null; created_at: string }`
  - Tabla `fund_transactions` con esas columnas (FK `fund_id → investments(id) ON DELETE CASCADE`, índice `(fund_id, date)`).
  - `queries.listTransactions(fundId, userId): Promise<TransactionRow[]>`, `queries.getTransaction(txId, userId): Promise<TransactionRow | null>`, `queries.insertTransaction(row: Omit<TransactionRow, "id" | "created_at">): Promise<TransactionRow>`, `queries.deleteTransaction(txId, userId): Promise<void>`
  - `queries.updateFundMetadata(isin: string, data: { ter?; category?; sectors?; geography?; topHoldings?; isCustom: boolean }): Promise<void>` (lo usa `MetadataEditModal`).
  - Migración en `ensureSchema()`: cada inversión sin movimientos recibe un `BUY` con sus `shares`, `purchase_price`, `purchase_date`, `amount = shares × purchase_price`, `fees = 0`.
  - Cliente: `api.transactions.list(fundId) → { transactions: Transaction[]; summary: PmpSummary }`, `api.transactions.add(fundId, data)`, `api.transactions.delete(fundId, txId)`; tipos `Transaction`, `PmpSummary`, `TransactionType` exportados de `api.ts`.
- `addTransaction` con `SELL`/`TRANSFER_OUT` de más participaciones que las actuales lanza `Error("No tienes tantas participaciones (tienes X)")`.

- [ ] **Step 1:** Tests: venta mayor que posición → lanza ese error; migración de una inversión de 66,893659 part. a 14,9491 € deja `calculatePmp` con `currentShares 66.893659` y `pmp 14.9491`.
- [ ] **Step 2:** FAIL → implementar → PASS (`bun test`).
- [ ] **Step 3:** En localhost: añadir una aportación a un fondo de prueba, ver cómo cambian participaciones/PMP, borrarla y volver al estado anterior. Las cifras de los 2 fondos de Rubén no cambian tras la migración.
- [ ] **Step 4:** Rediseño del modal con primitivas. Capturas. Commit.

### Task 9: Añadir fondo honesto

**Files:**
- Modify: `src/client/components/AddFundForm.tsx`

- [ ] **Step 1:** Paso 2 del formulario pide **participaciones** e **importe invertido** (del extracto del banco) y fecha; el precio = importe / participaciones (solo lectura, 4 decimales).
- [ ] **Step 2:** El precio histórico de la fecha se muestra como referencia: "Precio de referencia (dato mensual del 30/06/2025): 14,9491 €" y aviso si difiere > 2 % del calculado.
- [ ] **Step 3:** Rediseño con primitivas; probar alta y borrado de un fondo de prueba. Capturas. Commit.

### Task 10: Resto de secciones

**Files:**
- Modify: `AnalyticsSection.tsx`, `dashboard/AnalyticsTab.tsx`, `NotifyPanel.tsx`, `ReportsHub.tsx`, `UserReportTemplate.tsx`, `AdminReportTemplate.tsx`, `AdminPanel.tsx`, `DocsTab.tsx`, `ApiDocsModal.tsx`, `dashboard/MetadataEditModal.tsx`, `Header.tsx`

- [ ] **Step 0 (contabilidad con tests):** Sacar a funciones puras con test los cálculos que hoy viven en componentes:
  - `src/client/tax.ts`: `irpfSavingsTax(gain: number): { brackets: { from: number; to: number | null; rate: number; base: number; tax: number }[]; total: number; effectiveRate: number }` con tramos del ahorro 19 % (0–6.000), 21 % (6.000–50.000), 23 % (50.000–200.000), 27 % (200.000–300.000), 30 % (>300.000). Tests: `225.48 → total 42.84`; `10000 → 6000×0,19 + 4000×0,21 = 1980`; `0` y negativos → `total 0`.
  - `src/client/allocation.ts`: `allocationBy(funds: Investment[], key: "bank" | "category"): { name: string; value: number; pct: number }[]` (orden descendente, pct suma 100 ± 0,01). Test con los 2 fondos de Rubén → Ibercaja 70,2 %, Santander 29,8 %.
  - Ampliar `src/server/tests/sentinel.test.ts` para `computeInvestmentStats` (precio nulo → valor = invertido, pérdida, 0 participaciones) y `computePortfolioTotals` (vacío → todo 0, sin `NaN`).
- [ ] **Step 1:** Rediseñar cada una con primitivas y tokens; informes PDF con la nueva identidad (fondo claro para imprimir, acento violeta/dorado).
- [ ] **Step 2:** Quitar cualquier dato de relleno que no venga de la API.
- [ ] **Step 3:** Probar: descargar PDF, CSV y JSON; vista previa de WhatsApp; panel admin carga usuarios. Capturas. Commit (uno por sección).

### Task 11: Cierre de calidad

- [ ] **Step 1:** Borrar código muerto: `DashboardLoader.tsx`, `useFundQuotes.ts` si siguen sin uso, `index.html` raíz antiguo si no lo sirve nadie (comprobar con `grep`).
- [ ] **Step 2:** `bunx tsc --noEmit -p .` → 0 errores. `bun test` → todo verde. `bun run build` → OK.
- [ ] **Step 3:** Capturas finales de todo en oscuro, claro y móvil; revisión completa con Rubén.
- [ ] **Step 4:** Con su aprobación: subir a GitHub `main` (Render despliega) y verificar login + panel en `https://fondtracker.onrender.com`.
