# FondTracker
## Plataforma Integral de Gestion Patrimonial, Analitica Financiera y Seguimiento de Inversiones

[![Runtime: Bun](https://img.shields.io/badge/Runtime-Bun%20v1.3+-black?style=flat-square&logo=bun)](https://bun.sh)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript%205.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20SPA-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Styling: Tailwind v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Database: MySQL](https://img.shields.io/badge/Database-MySQL%208%20%2F%20MariaDB-4479A1?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-39FF88?style=flat-square)](https://opensource.org/licenses/MIT)

**FondTracker** es una plataforma web full-stack de ultima generacion para la monitorizacion en tiempo real, analisis profundo de asignacion de activos (Asset Allocation), simulacion de rebalanceos y generacion de informes ejecutivos de carteras de inversion (Fondos Indexados, Fondos Activos, ETFs y Acciones).

[Caracteristicas](#caracteristicas-principales) | [Arquitectura](#arquitectura-del-sistema) | [Modulos de Analitica](#analitica-financiera-y-asset-allocation) | [API REST](#referencia-de-la-api-rest) | [Instalacion](#instalacion-y-despliegue) | [Contacto](#contacto)

---

## Caracteristicas Principales

### 1. Motor de Cotizaciones en Tiempo Real y Scraping Hibrido
* **Multi-Proveedor Resiliente**: Integracion directa con Yahoo Finance v8 Chart API y motor de scraping secundario de respaldo (QueFondos / BME) para fondos no listados en mercados internacionales.
* **Descubrimiento Automatico de ISIN**: Mapeo inteligente de codigos ISIN a tickers de mercado (.MC, .PA, .F, etc.).
* **Optimizacion de Alta Frecuencia**: Cache en memoria con TTL de 5 minutos y mecanismo de Request Coalescing (bloqueo por mutex de peticiones simultaneas) para evitar peticiones duplicadas a los proveedores.
* **Cache Persistente en Base de Datos**: Respaldo automatico del ultimo valor liquidativo (NAV) en la tabla fund_prices para garantizar operatividad ininterrumpida ante caidas externas.

---

### 2. Analitica Avanzada y Asset Allocation
* **Desglose de Clases de Activos**: Monitorizacion de exposicion en Renta Variable, Renta Fija, Monetarios, Mixtos y Alternativos.
* **Exposicion Sectorial y Geografica**: Ponderacion consolidada de toda la cartera en sectores clave (Tecnologia, Salud, Financiero, etc.) y regiones (EE.UU., Europa, Mercados Emergentes, Asia-Pacifico).
* **Top Activos Subyacentes**: Deteccion de concentracion en empresas subyacentes (Microsoft, Apple, NVIDIA, Amazon, ASML, etc.).
* **Calculadora de Costes y TER Ponderado**: Calculo del Total Expense Ratio (TER) medio de la cartera y proyeccion del impacto de comisiones a 1, 5, 10 y 20 anos.
* **Indicadores de Riesgo y Diversificacion**: Puntuacion de riesgo sintetico SRRI (1 a 7) e Indice de Concentracion Herfindahl-Hirschman (HHI).
* **Simulador Interactivo de Rebalanceo**: Asignacion de pesos objetivo por fondo, calculo de aportaciones extraordinarias y generacion de ordenes de compra/venta para reequilibrar la cartera.

---

### 3. Experiencia Movil de Grado Nativo y Diseno Premium
* **Diseno Ultra-Responsivo**: Barra de navegacion inferior movil fija con boton flotante de accion rapida (Bottom Navigation Bar), panel lateral deslizante (Drawer) y areas seguras (Safe Area Insets).
* **Interaccion Tactil en Graficas**: Navegacion y deslizamiento tactil fluido en los lienzos interactivos de las tarjetas de fondos.
* **Motor Dual de Temas**: Modo Oscuro Cyber-Fintech (por defecto) y Modo Claro de Alto Contraste adaptado a normativas de accesibilidad WCAG AAA.
* **Animaciones Suaves y Aceleracion por GPU**: Transiciones fluidas a 120 FPS sin bloqueos ni recargas completas.

---

### 4. Hub de Informes y Exportacion
* **Informes Ejecutivos en PDF Multipage**: Generacion cliente de dossiers en formato vectorial con graficos sparkline de cotizacion a 1 ano, tablas desglosadas de rentabilidad, plusvalias latentes y fiscalidad.
* **Exportacion a CSV**: Formato universal compatible con Microsoft Excel, Google Sheets y Numbers.
* **Copias de Seguridad en JSON**: Exportacion e importacion integra de posiciones y configuraciones para migracion o respaldo de datos.

---

### 5. Automatizacion de Alertas via WhatsApp
* **Resumenes Diarios Automatizados**: Envio de reportes periodicos de evolucion patrimonial via CallMeBot API.
* **Programador Horario de 24 Horas**: Selector de hora preferida de entrega con soporte para husos horarios globales (Europe/Madrid, UTC, etc.).
* **Verificacion en Vivo**: Boton de prueba interactivo para validar la recepcion de mensajes instantaneos.

---

### 6. Panel de Administracion y Documentacion Integrada
* **Suite de Administracion Global**: Control y moderacion de usuarios registrados, catalogo de fondos, metricas de memoria del servidor, logs de scraping y envios masivos.
* **Consola Interactiva de APIs**: Pestana de documentacion viva con consola de pruebas para ejecutar endpoints en tiempo real y snippets en cURL, Fetch y Python.

---

## Arquitectura del Sistema

El proyecto esta disenado bajo una arquitectura desacoplada y tipada con TypeScript:

```text
FondTracker/
  src/
    client/                       # FRONTEND (React 18 SPA + Tailwind CSS v4)
      components/                 # Componentes visuales y modulos de la interfaz
        UserDashboard.tsx         # Shell principal del Dashboard y navegacion
        PortfolioSection.tsx      # Gestion de inversiones, filtros y vista tarjetas/tabla
        AnalyticsSection.tsx      # Exposicion sectorial, geografica, TER y rebalanceo
        FundCard.tsx              # Tarjeta interactiva de fondo con canvas y metricas
        AddFundForm.tsx           # Formulario de alta con busqueda en catalogo
        NotifyPanel.tsx           # Configuracion de alertas WhatsApp y horario 24h
        ReportsHub.tsx            # Generacion de informes PDF, CSV y backup JSON
        UserReportTemplate.tsx    # Plantilla vectorial para exportacion de PDF
        AdminPanel.tsx            # Panel de control y metricas para administradores
        DocsTab.tsx               # Manual tecnico y consola de pruebas REST
        Header.tsx                # Barra de navegacion publica con menu movil
        LandingPage.tsx           # Pagina de presentacion publica y caracteristicas
        LoginPage.tsx             # Portal de acceso seguro
        RegisterPage.tsx          # Registro de nuevos usuarios
        LegalPage.tsx             # Terminos del servicio y politica de privacidad
        Footer.tsx                # Pie de pagina institucional
      api.ts                      # Cliente HTTP REST tipado con interceptor JWT
      theme.ts                    # Motor de temas Claro / Oscuro
      utils.ts                    # Formateadores numericos, divisas y calculos
      styles.css                  # Capa base de estilos y utilidades Tailwind v4
      App.tsx                     # Enrutador principal de la SPA
      main.tsx                    # Punto de montaje de React en el DOM

    server/                       # BACKEND (Bun Native HTTP + MySQL)
      index.ts                    # Servidor HTTP, middleware CORS y enrutador REST
      db.ts                       # Pool de MySQL2 y migraciones automaticas (ensureSchema)
      auth.ts                     # Autenticacion, hashing Argon2 y gestion de tokens JWT
      sentinel.ts                 # Motor de consolidacion financiera de carteras
      yahoo.ts                    # Cliente de cotizaciones e historicos de Yahoo Finance
      quefondos.ts                # Motor de scraping secundario para fondos espanoles
      fund-catalog.ts             # Gestion del catalogo centralizado de fondos y ETFs
      metadata.ts                 # Extraccion de composiciones sectoriales y geograficas
      whatsapp.ts                 # Integracion de mensajeria con CallMeBot
      digest.ts                   # Tareas programadas (Cron) para resumenes automaticos
      admin.ts                    # Metricas de servidor, gestion de usuarios y moderacion

  public/                         # Recursos estaticos servidos por el servidor
  dist/                           # Bundle optimizado de produccion generado por Bun
  build.ts                        # Script de compilacion y bundling del frontend
  package.json                    # Dependencias y scripts del proyecto
  README.md                       # Documentacion oficial
```

---

## Analitica Financiera y Asset Allocation

| Modulo | Metricas Calculadas | Visualizacion |
| :--- | :--- | :--- |
| **Clases de Activos** | Renta Variable, Renta Fija, Monetarios, Alternativos | Grafico de Donut interactivo y Porcentajes |
| **Sectores Globales** | Tecnologia, Salud, Consumo, Finanzas, Industrial, Energia, etc. | Graficos de barras ponderadas |
| **Geografia** | Estados Unidos, Zona Euro, Mercados Emergentes, Japon, etc. | Distribucion regional con pesos porcentuales |
| **Top Holdings** | Ponderacion de acciones subyacentes individuales (MSFT, NVDA, AAPL...) | Ranking de empresas con impacto en cartera |
| **Costes y TER** | Comision de gestion media ponderada y Coste anual acumulado | Proyeccion de impacto a 1, 5, 10 y 20 anos |
| **Riesgo y Concentracion**| Indicador de Riesgo SRRI (1 a 7) e Indice HHI | Calificacion de perfil (Conservador a Crecimiento) |
| **Rebalanceo** | Desviacion de pesos objetivo (EUR y %) y Ordenes de ajuste | Calculadora con simulacion de aportacion extra |

---

## Referencia de la API REST

Todos los endpoints que requieren autenticacion admiten el token en la cabecera `Authorization: Bearer <token>`.

### Autenticacion y Cuenta
| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registro de nuevo usuario (nombre, email, contrasena). |
| `POST` | `/api/auth/login` | Inicio de sesion y obtencion del token JWT. |
| `GET` | `/api/auth/me` | Obtiene el perfil del usuario autenticado. |
| `PUT` | `/api/auth/account` | Actualizacion de email, telefono o contrasena. |
| `DELETE` | `/api/auth/account` | Eliminacion definitiva de la cuenta y sus datos. |

### Gestion de Cartera
| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/api/portfolio` | Obtiene todas las posiciones del usuario con cotizaciones en vivo y totales. |
| `POST` | `/api/investments` | Anade una nueva posicion indicando ISIN, participaciones y precio de compra. |
| `PUT` | `/api/investments/:id` | Modifica una inversion existente (numero de titulos, precio o banco). |
| `DELETE` | `/api/investments/:id` | Elimina una posicion de la cartera del usuario. |

### Mercado y Catalogo
| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/api/chart?isin=...&range=1y` | Datos historicos de cotizacion para visualizacion de graficas (1mo, 6mo, 1y, max). |
| `GET` | `/api/catalog/search?q=...` | Busqueda por texto en el catalogo europeo de fondos y ETFs. |
| `GET` | `/api/catalog/banks` | Listado de entidades bancarias registradas en el sistema. |

### Notificaciones WhatsApp
| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/api/whatsapp/config` | Obtiene la configuracion de alertas WhatsApp del usuario. |
| `POST` | `/api/whatsapp/config` | Actualiza la API Key de CallMeBot, horario preferido y activacion. |
| `POST` | `/api/whatsapp/test` | Envia un mensaje de prueba inmediato a WhatsApp. |

### Panel de Administracion (Solo Administradores)
| Metodo | Endpoint | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/api/admin/overview` | Estadisticas globales de usuarios, posiciones y salud del servidor. |
| `GET` | `/api/admin/users` | Listado y auditoria de todos los usuarios registrados. |
| `POST` | `/api/admin/broadcast` | Envio de comunicado masivo a todos los usuarios con alertas activas. |

---

## Instalacion y Despliegue

### Requisitos Previos
* [Bun](https://bun.sh) v1.1 o superior instalado en el sistema.
* MySQL 8.0+ o MariaDB 10.5+ (local via Docker/XAMPP o en la nube via Railway, PlanetScale, Neon).

### 1. Clonar el Repositorio e Instalar Dependencias
```bash
git clone https://github.com/rubenblascoa/FondTracker.git
cd FondTracker
bun install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raiz del proyecto basandote en la siguiente plantilla:

```env
# Servidor HTTP
HOST=0.0.0.0
PORT=3741
NODE_ENV=production

# Base de Datos MySQL
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_password_aqui
MYSQL_DATABASE=fondtracker

# Seguridad
JWT_SECRET=tu_clave_secreta_super_segura_de_al_menos_32_caracteres
```

### 3. Compilar el Frontend y Levantar el Servidor
```bash
# Compilar el bundle de produccion del cliente React
bun build.ts

# Iniciar el servidor
bun run start
```
> Nota: La base de datos se inicializa y migra de forma automatica en el primer arranque mediante ensureSchema(), sin necesidad de ejecutar ficheros SQL manuales.

---

## Seguridad y Privacidad

* **Cifrado de Credenciales**: Las contrasenas de acceso se procesan mediante algoritmos de derivacion de claves de alta resistencia (Argon2 / SHA-256).
* **Tokens de Sesion Efimeros**: Los tokens JWT se transmiten mediante fragmentos hash (#token=...), impidiendo que queden registrados en historiales de peticiones del servidor o proxies intermedios.
* **Aislamiento Multi-Inquilino**: Cada consulta a base de datos esta estrictamente filtrada por el user_id del token verificado.
* **Proteccion contra Inyecciones SQL**: Consultas parametrizadas tipadas con mysql2/promise.
* **Sin Rastreadores**: Sin librerias de analitica externa ni rastreadores publicitarios.

---

## Contacto

Desarrollado y mantenido por **Ruben Blasco Armengod**.

* GitHub: [@rubenblascoa](https://github.com/rubenblascoa)
* Correo Electronico: [rubenblascoarmengod@gmail.com](mailto:rubenblascoarmengod@gmail.com)
