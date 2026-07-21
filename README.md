<div align="center">

<img src="https://cdn-icons-png.flaticon.com/512/2830/2830284.png" alt="FondTracker Logo" width="200" />

<h3>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:trending-up.svg?color=white">
    <img src="https://api.iconify.design/lucide:trending-up.svg?color=black" alt="Chart" width="28" align="center" />
  </picture>
  FondTracker | Personal Investment Tracker
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:wallet.svg?color=white">
    <img src="https://api.iconify.design/lucide:wallet.svg?color=black" alt="Wallet" width="28" align="center" />
  </picture>
</h3>

**Español**

---

**La plataforma definitiva para el seguimiento personal de fondos de inversión y ETFs.**

![Views](https://komarev.com/ghpvc/?username=rubenblascoa&repo=fondtracker&label=Views&icon=0&color=121011&style=flat-square)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Runtime](https://img.shields.io/badge/Runtime-Bun-black?style=flat-square)](#)
[![Database](https://img.shields.io/badge/Database-MySQL-orange?style=flat-square)](#)
[![Live Site](https://img.shields.io/badge/Live-Online-brightgreen?style=flat-square)](#)


**FondTracker** es una aplicación web full-stack diseñada para el seguimiento en tiempo real de una cartera personal de fondos de inversión, ETFs y acciones. Permite registrar aportaciones, calcular rentabilidad histórica frente a precios de mercado en vivo (vía Yahoo Finance), gestionar múltiples usuarios de forma aislada y segura, y recibir resúmenes automáticos de cartera por WhatsApp según un horario configurable.

[Explorar el Código](#) · [Reportar un Error](#) · [Solicitar una Mejora](#)

---

</div>

## <picture><source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:folder-tree.svg?color=white"><img src="https://api.iconify.design/lucide:folder-tree.svg?color=black" width="26" align="center"></picture> Arquitectura y Estructura Modular

El backend implementa una clara separación de responsabilidades entre el servidor HTTP, el acceso a datos, la lógica de negocio y las integraciones externas. A continuación se detalla el propósito y la lógica interna de cada archivo del sistema:

### 1. Núcleo de Entrada y Orquestación
* **`src/server/index.ts`**
  * **Propósito:** Punto de entrada del servidor y enrutador principal de la API REST.
  * **Lógica detallada:** Levanta el servidor nativo de **Bun** sobre el host y puerto definidos por variables de entorno (`HOST`, `PORT`), invoca `ensureSchema()` para garantizar que el esquema de base de datos existe antes de aceptar tráfico, y expone más de 20 endpoints agrupados por dominio (autenticación, fondos, catálogo, cotizaciones, WhatsApp). Gestiona CORS de forma manual en cada respuesta y sirve tanto la SPA (`/dashboard`, `/login`, `/register`) como los recursos estáticos (`/public`) con protección explícita contra path traversal.

### 2. Capa de Persistencia
* **`src/server/db.ts`**
  * **Propósito:** Abstracción del pool de conexión MySQL y definición del esquema autogestionado.
  * **Lógica detallada:** Crea un `pool` con `mysql2/promise` a partir de variables de entorno (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`). La función `ensureSchema()` crea de forma idempotente las tablas `users`, `investments`, `fund_history`, `settings`, `fund_catalog` y `fund_prices`, además de migrar columnas nuevas (`ticker`, `user_id`) en despliegues ya existentes sin perder datos. Expone el objeto `queries` como capa de acceso a datos tipada para el resto de módulos.

### 3. Lógica de Negocio de Cartera
* **`src/server/sentinel.ts`**
  * **Propósito:** Motor de cálculo financiero de la cartera del usuario.
  * **Lógica detallada:** Resuelve el ticker de mercado de cada posición (propio, del catálogo, o mediante descubrimiento automático), obtiene el precio actual vía Yahoo Finance con caché en `fund_prices` como *fallback*, y calcula en paralelo (`Promise.all`) el valor invertido, valor actual, plusvalía absoluta y porcentual de cada fondo y del total de la cartera.

### 4. Autenticación y Seguridad de Sesión
* **`src/server/auth.ts`**
  * **Propósito:** Registro, login y gestión del ciclo de vida de la cuenta de usuario.
  * **Lógica detallada:** Aísla completamente los datos entre usuarios mediante `user_id`, valida credenciales con hashing seguro de contraseñas (Argon2), y resuelve la identidad del solicitante en cada petición protegida a través de `getUserFromRequest`.

### 5. Integración de Mercado
* **`src/server/yahoo.ts`**
  * **Propósito:** Cliente de datos de mercado en tiempo real.
  * **Lógica detallada:** Consulta la API pública de gráficos de Yahoo Finance para obtener precios actuales e históricos por rango (`1d`, `1wk`, `1mo`) e intervalo, con un mecanismo de descubrimiento de *ticker* a partir del ISIN cuando el fondo no lo trae precargado en el catálogo.

### 6. Notificaciones Automatizadas
* **`src/server/digest.ts`** + **`src/server/whatsapp.ts`**
  * **Propósito:** Generación y envío de resúmenes periódicos de cartera.
  * **Lógica detallada:** Un *scheduler* interno evalúa de forma recurrente si toca enviar el resumen según el huso horario y cron configurados, construye un mensaje formateado con la evolución de la cartera, y lo despacha a través de la API de CallMeBot hacia WhatsApp, persistiendo el estado del último envío en la tabla `settings`.

### 7. Interfaz Cliente
* **`src/client/`**
  * **Propósito:** Dashboard SPA para la visualización y gestión de la cartera.
  * **Lógica detallada:** Consume la API REST para listar posiciones, mostrar gráficos históricos de cotización, dar de alta/baja/editar fondos, y gestionar la configuración de cuenta y notificaciones desde el navegador, sin recargar página.

---

## <picture><source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:list.svg?color=white"><img src="https://api.iconify.design/lucide:list.svg?color=black" width="26" align="center"></picture> Características Principales

* **Multiusuario y Aislado:** Cada cuenta gestiona su propia cartera de forma independiente, con autenticación por contraseña hasheada.
* **Cotización en Tiempo Real:** Precios actuales e históricos obtenidos de Yahoo Finance, con caché local en base de datos como respaldo ante caídas del proveedor.
* **Catálogo de Fondos Precargado:** Búsqueda por texto completo (`FULLTEXT`) sobre cientos de fondos y ETFs indexados por ISIN, banco, categoría y nivel de riesgo.
* **Resúmenes por WhatsApp:** Notificaciones periódicas configurables (horario y zona horaria) con el estado de la cartera, enviadas vía CallMeBot de forma completamente aislada por usuario.
* **Optimizado de Alto Rendimiento:** Cuenta con coalescencia de peticiones en paralelo (Request Coalescing), almacenamiento en caché en memoria con un TTL de 5 minutos para cotizaciones e históricos de gráficos, y procesamiento unificado por ISIN único para evitar sobrecargar a los proveedores externos y eliminar el lag en el frontend.
* **Despliegue 100% Gratuito:** Backend en **Render** (free tier) conectado a una base de datos **MySQL en Railway**, sin coste mensual para uso personal.
* **Auto-gestión de Esquema:** La base de datos se crea y migra sola al arrancar (`ensureSchema()`), sin necesidad de scripts de migración manuales en producción.

---
## <picture><source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:git-compare.svg?color=white"><img src="https://api.iconify.design/lucide:git-compare.svg?color=black" width="26" align="center"></picture> El Problema vs La Solución

Llevar el seguimiento de una cartera de fondos "a mano" (Excel, apuntes sueltos, apps bancarias fragmentadas) es lento y poco fiable.

| Sin FondTracker | Con FondTracker |
| :--- | :--- |
| Rentabilidad calculada manualmente en Excel | **Cálculo automático** en tiempo real |
| Precios desactualizados o buscados uno a uno | **Cotización en vivo** vía Yahoo Finance |
| Datos de la cartera solo en tu PC (XAMPP local) | **Acceso desde cualquier lugar** (nube) |
| Sin aviso de cómo va la cartera | **Resúmenes automáticos por WhatsApp** |
| Un solo usuario / sin control de acceso | **Multiusuario** con autenticación segura |
| Catálogo de fondos disperso o inexistente | **Catálogo centralizado** con búsqueda instantánea |

---

## <picture><source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:hard-drive.svg?color=white"><img src="https://api.iconify.design/lucide:hard-drive.svg?color=black" width="26" align="center"></picture> Stack e Instalación

* **Runtime:** [Bun](https://bun.sh)
* **Lenguaje:** TypeScript
* **Base de datos:** MySQL (compatible con MariaDB en desarrollo local)
* **Frontend:** SPA servida como HTML/JS estático desde `src/client`
* **Mercado:** Yahoo Finance (API pública de gráficos)
* **Notificaciones:** CallMeBot (WhatsApp)
* **Hosting recomendado (gratuito):** Backend en [Render](https://render.com) · Base de datos en [Railway](https://railway.com)

### Variables de entorno requeridas

| Variable | Descripción | Por defecto |
| :--- | :--- | :--- |
| `HOST` | Interfaz de red de escucha | `0.0.0.0` |
| `PORT` | Puerto del servidor | `3741` |
| `MYSQL_HOST` | Host de la base de datos | `127.0.0.1` |
| `MYSQL_PORT` | Puerto de la base de datos | `3306` |
| `MYSQL_USER` | Usuario de la base de datos | `root` |
| `MYSQL_PASSWORD` | Contraseña de la base de datos | *(vacío)* |
| `MYSQL_DATABASE` | Nombre de la base de datos | `fondtracker` |

### Despliegue inicial

1. Clona el repositorio y ejecuta `bun install`.
2. Configura las variables de entorno anteriores apuntando a tu instancia de MySQL (local vía XAMPP, o remota vía Railway/PlanetScale/Neon).
3. Arranca el servidor con `bun run start` — el esquema de base de datos se crea automáticamente en el primer arranque.
4. Accede a `http://localhost:3741` (o al `HOST`/`PORT` configurados), regístrate como usuario y comienza a añadir posiciones desde el catálogo de fondos.

---

## <picture><source media="(prefers-color-scheme: dark)" srcset="https://api.iconify.design/lucide:mail.svg?color=white"><img src="https://api.iconify.design/lucide:mail.svg?color=black" width="26" align="center"></picture> Contacto

Desarrollado por **Rubén Blasco Armengod**.

* **GitHub:** [@rubenblascoa](https://github.com/rubenblascoa)
* **Email:** rubenblascoarmengod@gmail.com
