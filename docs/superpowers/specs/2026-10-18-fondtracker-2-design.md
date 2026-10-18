# FondTracker 2.0 — Diseño (fase 1: visual + terminar funciones)

Fecha: 2026-10-18 · Autor: Rubén Blasco Armengod (con Claude)

## Intención y porqué

FondTracker funciona pero se quedó a medias: el panel tiene un rediseño sin conectar, varias
funciones están incompletas y la estética no está a la altura del resto de proyectos de Rubén
(su portfolio `rubenblascoa.github.io`) ni de la competencia (Delta, Parqet, Getquin).

El objetivo de esta fase es que la plataforma **se vea y funcione como un producto terminado**,
de la landing al último ajuste. Las fuentes de datos de precios y las criptomonedas son la
**fase 2** y quedan fuera de este documento (ver "Fuera de alcance").

## Objetivos

1. **Rediseño visual completo ("Mezcla 2")** aplicado a todas las pantallas: landing, login,
   registro, legal, panel (todas las secciones), modales, ajustes, panel de admin, documentación
   API, informes PDF y mensajes de error/vacío/carga.
2. **Terminar lo que está a medias** y quitar lo que es falso, para que todo lo que se ve funcione.
3. **Cero errores de TypeScript** (`bunx tsc --noEmit`) y la app desplegada en Render funcionando.

## No objetivos (esta fase)

- Cambiar de fuente de precios (QueFondos/Yahoo) o añadir precio diario oficial → fase 2.
- Criptomonedas → fase 2.
- Conectar bancos automáticamente (open banking).
- App nativa móvil.

## Anti-objetivos (sería un fracaso aunque "funcione")

- Que la web enseñe **datos o métricas inventadas** (cifras de demo en la landing, TWR/XIRR que no
  se calculan, gráficos planos de relleno).
- Que un número de dinero del usuario cambie respecto a hoy **sin una razón explicada** (el
  rediseño no debe alterar cálculos salvo los arreglos listados aquí).
- Perder datos de usuarios existentes (5 usuarios, 2 inversiones en TiDB).
- Romper el login (email/contraseña, Google, GitHub) o el resumen de WhatsApp.

## Restricciones

- Stack actual: Bun + React 19 + Tailwind 4 + Recharts, servidor `src/server/index.ts`, MySQL en
  TiDB Cloud Starter (sin `FULLTEXT`, TLS obligatorio, collation `utf8mb4_general_ci`).
- Despliegue: Render, desde `github.com/rubenblascoa/fondtracker` rama `main`.
- Los cambios de esquema de BD deben ser aditivos y aplicarse desde `ensureSchema()` (no hay
  sistema de migraciones).
- Debe verse bien en móvil (≥ 360 px) y escritorio.

## Decisiones de Rubén

- **Dirección visual: "Mezcla 2"** (elegida entre A editorial, B neo-banco, C actual y dos mezclas):
  - Atmósfera de su portfolio: fondo casi negro (`#0b0b0a`) con grano sutil y un resplandor
    violeta suave en la parte superior.
  - Tipografía moderna redondeada (**Space Grotesk**) para titulares y cifras; **Inter** para
    texto; **JetBrains Mono** para etiquetas, ISIN y datos técnicos.
  - Superficies translúcidas (`rgba(255,255,255,.035)`, borde `rgba(255,255,255,.07)`), radios
    grandes (~18 px), botones tipo píldora; botón principal claro (`#f2efe8` sobre negro).
  - Acento: degradado **dorado `#e3b25b` → violeta `#c084fc`** (titulares destacados, línea de
    gráficos). Fondo de etiquetas: violeta suave `rgba(129,140,248,.14)` con texto `#c7d2fe`.
  - Verde/rojo **solo** para ganancias/pérdidas.
  - Referencia visual: `.superpowers/brainstorm/709-1792342897/content/mezcla-a-b.html` (opción m2).
- **Orden**: primero visual, luego terminar funciones, después (fase 2) datos de fondos y cripto.
- Rubén delega el detalle ("confío en ti") y quiere **ver capturas antes** de dar por buena cada
  pantalla grande.

## Alcance funcional ("terminarla")

1. **Unificar el panel**: completar la migración al panel modular ya empezado
   (`components/dashboard/OverviewTab`, `PortfolioTab`, `AnalyticsTab`, `DashboardNav`,
   `SettingsModal`, hooks `usePortfolio`, `useFundQuotes`), y retirar el monolito
   `UserDashboard.tsx` (1.890 líneas) cuando todo esté migrado. Hoy esos componentes no se importan.
2. **Movimientos (aportaciones, ventas, traspasos)**: `transactions.ts` y
   `routes/transactions.routes.ts` existen pero faltan la tabla, las consultas en `db.ts`
   (`listTransactions`, `insertTransaction`, tipos `TransactionRow`/`TransactionType`), el registro
   de rutas en `index.ts` y `api.transactions` en el cliente. Terminarlo de punta a punta con el
   cálculo PMP ya escrito (tiene tests en `tests/transactions.test.ts`). Las inversiones existentes
   deben quedar representadas como una compra inicial.
3. **Evolución del patrimonio real**: guardar una foto diaria del valor de cada cartera (tabla
   nueva) y pintar el gráfico con ella; hasta tener historial, reconstruirlo con los precios
   históricos disponibles × participaciones (sin línea plana falsa).
4. **Alta de fondo honesta**: el usuario introduce **participaciones e importe** del extracto del
   banco y el precio se deriva; la autocompletación por fecha se muestra solo como sugerencia y
   avisando de que el histórico es mensual.
5. **Fecha del precio visible** en cada fondo ("NAV 18,41 € · 14 oct") y aviso si está desfasado.
6. **Rangos de gráfico coherentes** con la granularidad del dato (quitar 1D/5D si el dato es
   mensual).
7. **Limpieza**: nombres de menú = títulos de pantalla; no mostrar el teléfono completo en el
   panel (enmascarar); landing sin cifras inventadas ni métricas inexistentes; eje del gráfico sin
   etiquetas duplicadas.
8. **Calidad**: 0 errores de tipos; tests existentes en verde.

## Decisiones mías (de Claude; Rubén puede cambiarlas)

- **Modo claro**: se mantiene (ya existe en el panel), adaptado a la nueva paleta; el oscuro es el
  predeterminado. Landing, login, registro y legal siguen siempre en oscuro, como hoy.
- **Se conservan todas las secciones actuales** (WhatsApp, informes PDF/CSV/JSON, simulador IRPF,
  análisis, panel admin, documentación API), rediseñadas.
- **Forma de trabajar**: en una rama aparte; a `main` (y por tanto a Render) solo va cada bloque
  cuando Rubén ha visto las capturas y lo aprueba. Orden de bloques: sistema visual + landing →
  login/registro/legal → panel → resto de secciones → funciones a medias.
- **Informes PDF** también adoptan la nueva identidad.

## Lo que se deja al constructor

- Estructura de componentes, nombres, organización de CSS/tokens (respetando los tokens de arriba).
- Iconografía (seguir con `lucide-react`).
- Animaciones y microinteracciones, con mesura.
- Textos/copys concretos (en español, tono directo, sin promesas falsas).
- Esquema exacto de las tablas nuevas (transacciones, fotos diarias), siempre aditivo.

## Fuera de alcance → fase 2 (informe aparte)

- Fuente de precio **diario** oficial (y guardado propio del histórico), conciliación con el banco.
- Criptomonedas.
- Rentabilidad ponderada por dinero (XIRR/TWR).
- Pendiente de investigar: Ibercaja muestra +160 € para Ibercaja Gestión Audaz (66,89 part.,
  1.000 € invertidos) y la app +231 € con el NAV oficial de QueFondos (18,41 € del 14/10/2026).
  Sin acceso a Ibercaja no se ha podido ver con qué precio/fecha valora el banco.
