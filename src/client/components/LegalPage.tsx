import { useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "../api";
import { onAuthChange } from "../api";
import { ChevronDown, Database, EyeOff, KeyRound, LogOut, Mail, ShieldCheck, UserCheck } from "lucide-react";

// Sección legal de FondTracker: privacidad, términos y seguridad. Los textos describen lo que hace
// el código de verdad; si cambia qué datos se guardan, con quién se comparten o cómo se borran,
// hay que actualizarlos aquí (y la fecha). Se ve siempre en oscuro, como la landing.

type View = "privacy" | "terms" | "security";
interface LegalPageProps {
  view: View;
  user?: User | null;
  onLogout?: () => void;
}

const UPDATED = "19 de octubre de 2026";
const CONTACT = "rubenblascoarmengod@gmail.com";
const GITHUB = "https://github.com/rubenblascoa/fondtracker";
const PATHS: Record<View, string> = { privacy: "/legal/privacy-policy", terms: "/legal/terms-of-service", security: "/legal/security" };
const TABS: { id: View; label: string }[] = [
  { id: "privacy", label: "Privacidad" },
  { id: "terms", label: "Términos" },
  { id: "security", label: "Seguridad" },
];
const INTRO: Record<View, { title: string; lead: string }> = {
  privacy: { title: "Política de privacidad", lead: "Qué datos guardamos, para qué, con quién se comparten y cómo ejercer tus derechos." },
  terms: { title: "Términos de uso", lead: "Las condiciones para usar FondTracker y lo que el servicio es y no es." },
  security: { title: "Seguridad", lead: "Cómo protegemos la aplicación y cómo avisarnos si encuentras un fallo." },
};

const INK = "linear-gradient(90deg, #3ee0ff, #6f7bff 45%, #d15bff)";

function WaveLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M2.5 9c2.5 0 2.5 4.2 5 4.2S10 9 12 9s2.5 4.2 5 4.2S19.5 9 21.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2.5 15c2.5 0 2.5 4.2 5 4.2S10 15 12 15s2.5 4.2 5 4.2S19.5 15 21.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

const mail = (
  <a href={`mailto:${CONTACT}`} className="font-medium text-white underline decoration-white/30 underline-offset-[3px] hover:decoration-white">
    {CONTACT}
  </a>
);
const strong = (t: string) => <strong className="font-medium text-white">{t}</strong>;

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.025]">
      <table className="w-full min-w-[560px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-white/10">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-[12px] font-medium uppercase tracking-wider text-[#7d8296]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.06] align-top last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-3 leading-6 ${j === 0 ? "text-white" : "text-[#b9becf]"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: INK }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

type Section = { id: string; title: string; body: ReactNode };

const PRIVACY: Section[] = [
  {
    id: "responsable",
    title: "Quién trata tus datos",
    body: (
      <p>
        FondTracker es un proyecto personal y de código abierto de {strong("Rubén Blasco Armengod")}, que es el responsable del tratamiento de tus datos. Para cualquier consulta sobre privacidad o para
        ejercer tus derechos, escribe a {mail}.
      </p>
    ),
  },
  {
    id: "datos",
    title: "Qué datos guardamos y para qué",
    body: (
      <>
        <Table
          head={["Datos", "Para qué", "Base legal"]}
          rows={[
            ["Usuario, email y contraseña (guardada solo como hash Argon2id)", "Crear tu cuenta y dejarte entrar", "Ejecución del servicio que pides"],
            ["Identificador de Google o GitHub", "Entrar con esas cuentas, si lo eliges", "Ejecución del servicio"],
            ["Nombre para el saludo (opcional)", "Saludarte en el panel y en el resumen por WhatsApp", "Tu consentimiento (puedes borrarlo en Ajustes)"],
            ["Fondos que apuntas: ISIN, nombre, entidad, participaciones, precio y fecha de compra, notas y movimientos", "Calcular cuánto vale tu cartera y cómo ha ido", "Ejecución del servicio"],
            ["Foto diaria del valor de tu cartera (invertido y valor)", "Enseñarte la evolución de tu patrimonio", "Ejecución del servicio"],
            ["Teléfono, clave de CallMeBot, horas y zona horaria del resumen", "Enviarte el resumen por WhatsApp", "Tu consentimiento (lo activas y desactivas tú)"],
            ["Dirección IP", "Limitar intentos de acceso y peticiones abusivas. Solo se usa en memoria; no se guarda en la base de datos", "Interés legítimo: seguridad del servicio"],
          ]}
        />
        <p>
          FondTracker {strong("no se conecta a tu banco")}, no pide sus claves y no puede mover dinero: solo guarda lo que tú apuntas. No vendemos ni cedemos tus datos con fines publicitarios.
        </p>
      </>
    ),
  },
  {
    id: "terceros",
    title: "Con quién se comparten",
    body: (
      <>
        <p>Solo con los proveedores necesarios para que el servicio funcione, y solo con lo que cada uno necesita:</p>
        <Table
          head={["Proveedor", "Qué recibe", "Dónde"]}
          rows={[
            ["TiDB Cloud (PingCAP)", "La base de datos completa de la aplicación", "Unión Europea (Frankfurt)"],
            ["Render", "Aloja la aplicación, por lo que procesa tus peticiones", "Proveedor de EE. UU."],
            ["CallMeBot", "Tu teléfono, tu clave y el texto de cada resumen (con el valor de tu cartera), solo si activas el WhatsApp", "Servicio de terceros"],
            ["Google / GitHub", "Los datos del inicio de sesión, solo si entras con ellos", "EE. UU."],
            ["Cloudflare Web Analytics", "Estadísticas de visitas agregadas, sin cookies", "EE. UU."],
            ["Google Fonts", "Tu dirección IP al cargar las tipografías de la web", "EE. UU."],
            ["QueFondos, Financial Times y Yahoo Finance", "Solo el ISIN o el ticker del fondo para consultar su precio; ningún dato tuyo", "—"],
          ]}
        />
        <p>
          Cuando un proveedor está fuera del Espacio Económico Europeo, la transferencia se ampara en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión
          Europea, según el caso.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    title: "Cuánto tiempo los guardamos",
    body: (
      <>
        <p>Mientras tu cuenta esté activa.</p>
        <p>
          Si eliminas la cuenta desde Ajustes, se {strong("desactiva al momento")}: ya no podrás entrar, tus fondos dejan de mostrarse y dejas de recibir resúmenes. Los datos quedan desactivados, no
          borrados, por si pides recuperarla. Si quieres que se {strong("borren definitivamente")}, escríbenos a {mail} y lo haremos en un plazo máximo de un mes.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies y almacenamiento del navegador",
    body: (
      <>
        <Table
          head={["Nombre", "Para qué", "Duración"]}
          rows={[
            [<code key="a" className="font-mono text-[13px]">ft_session</code>, "Cookie técnica que mantiene tu sesión iniciada", "24 horas"],
            [<code key="b" className="font-mono text-[13px]">ft_oauth</code>, "Comprobar que el acceso con Google o GitHub vuelve al mismo navegador", "10 minutos"],
            [<code key="c" className="font-mono text-[13px]">fondtracker_token</code>, "Copia de la sesión en el almacenamiento de la pestaña", "Hasta cerrar la pestaña"],
            [<code key="d" className="font-mono text-[13px]">fondtracker_theme</code>, "Recordar si prefieres el tema claro u oscuro", "Hasta que lo borres"],
          ]}
        />
        <p>No usamos cookies publicitarias ni de seguimiento. Todas las de la tabla son imprescindibles para que funcione lo que pides, por eso no requieren consentimiento.</p>
      </>
    ),
  },
  {
    id: "derechos",
    title: "Tus derechos",
    body: (
      <>
        <p>Puedes pedir acceder a tus datos, rectificarlos, borrarlos, limitar u oponerte a su uso y llevártelos (portabilidad). Buena parte lo puedes hacer tú mismo:</p>
        <List items={["Corregir tu nombre, email, teléfono y contraseña en Ajustes.", "Editar o borrar tus fondos en Mi cartera.", "Descargar una copia completa en JSON desde Informes."]} />
        <p>
          Para todo lo demás, escribe a {mail}; respondemos en un mes como máximo. Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
          (aepd.es).
        </p>
      </>
    ),
  },
];

const TERMS: Section[] = [
  {
    id: "servicio",
    title: "Qué es FondTracker",
    body: (
      <p>
        FondTracker es una herramienta gratuita para apuntar los fondos de inversión y ETFs que tienes en distintas entidades y ver cuánto valen. La ofrece Rubén Blasco Armengod ({mail}) como proyecto
        personal. Al crear una cuenta o usar el servicio aceptas estos términos.
      </p>
    ),
  },
  {
    id: "asesoramiento",
    title: "No es asesoramiento financiero",
    body: (
      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-5 text-[#e8e2d0]">
        FondTracker no es una entidad financiera ni un asesor de inversiones. Nada de lo que muestra es una recomendación para comprar, vender o mantener ningún producto. Las decisiones de inversión son
        solo tuyas.
      </div>
    ),
  },
  {
    id: "precios",
    title: "Precios y cálculos",
    body: (
      <>
        <p>
          Los precios se obtienen de fuentes públicas de terceros: QueFondos (valor liquidativo de los fondos españoles), Financial Times (histórico diario) y Yahoo Finance (ETFs). Las gestoras publican el
          valor liquidativo con días de retraso y esas fuentes pueden tener errores o dejar de estar disponibles; por eso cada fondo enseña la fecha del precio que se usa.
        </p>
        <p>
          Los cálculos (valor, ganancia, rentabilidad, evolución) dependen de los datos que apuntas tú. El simulador de IRPF es orientativo: no tiene en cuenta tu situación fiscal completa y no sustituye a
          tu declaración ni a un asesor fiscal. Comprueba siempre las cifras con los extractos de tu entidad.
        </p>
      </>
    ),
  },
  {
    id: "whatsapp",
    title: "Resumen por WhatsApp",
    body: (
      <p>
        El resumen se envía a través de CallMeBot, un servicio de terceros que activas con tu propia clave. Su funcionamiento no depende de FondTracker: puede retrasarse, fallar o dejar de prestarse.
        Puedes desactivarlo cuando quieras.
      </p>
    ),
  },
  {
    id: "cuenta",
    title: "Tu cuenta",
    body: (
      <List
        items={[
          "Eres responsable de la exactitud de los datos que apuntas y de proteger el acceso a tu cuenta.",
          "No está permitido intentar acceder a cuentas o datos ajenos, saturar el servicio ni usarlo para fines ilícitos. Si ocurre, podremos suspender la cuenta; las cuentas desactivadas pueden restaurarse.",
          "Puedes dejar de usar el servicio y eliminar tu cuenta cuando quieras desde Ajustes (ver la política de privacidad).",
        ]}
      />
    ),
  },
  {
    id: "responsabilidad",
    title: "Disponibilidad y responsabilidad",
    body: (
      <p>
        El servicio se ofrece gratis y «tal cual», sin garantía de disponibilidad continua ni de que esté libre de errores. Puede cambiar o dejar de prestarse; si se cierra, se avisará con antelación
        razonable para que puedas descargar tus datos. Dentro de lo que permite la ley, no respondemos de pérdidas derivadas de decisiones tomadas con la información mostrada.
      </p>
    ),
  },
  {
    id: "codigo",
    title: "Código abierto",
    body: (
      <p>
        El código de FondTracker es público en{" "}
        <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="font-medium text-white underline decoration-white/30 underline-offset-[3px] hover:decoration-white">
          GitHub
        </a>{" "}
        bajo licencia MIT. Esa licencia regula el uso del código; estos términos regulan el uso del servicio publicado en esta web.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "Cambios y legislación",
    body: (
      <p>
        Si estos términos cambian de forma relevante, se avisará en la web y se actualizará la fecha. Se rigen por la ley española; si eres consumidor, conservas los derechos y el fuero que te reconoce la
        normativa de consumo.
      </p>
    ),
  },
];

const SECURITY: Section[] = [
  {
    id: "avisar",
    title: "Cómo avisarnos de un fallo",
    body: (
      <>
        <p>
          Si encuentras una vulnerabilidad, escríbenos a {mail} con una descripción, los pasos para reproducirla y qué podría verse afectado. Te contestaremos lo antes posible y te mantendremos al tanto
          mientras lo arreglamos.
        </p>
        <p>
          La misma información está en formato estándar en{" "}
          <a href="/.well-known/security.txt" className="font-mono text-[14px] text-white underline decoration-white/30 underline-offset-[3px]">
            /.well-known/security.txt
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "pedimos",
    title: "Qué te pedimos",
    body: (
      <List
        items={[
          "No accedas, modifiques ni borres datos de otras personas más allá de lo mínimo para demostrar el fallo.",
          "No hagas pruebas que saturen el servicio (denegación de servicio), envíen spam o engañen a otras personas.",
          "Danos un tiempo razonable para corregirlo antes de hacerlo público.",
        ]}
      />
    ),
  },
  {
    id: "alcance",
    title: "Qué entra",
    body: (
      <>
        <p>
          La aplicación publicada en este dominio y su código en{" "}
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="font-medium text-white underline decoration-white/30 underline-offset-[3px]">
            GitHub
          </a>
          .
        </p>
        <p>
          Quedan fuera los servicios de terceros (CallMeBot, Google, GitHub, Render, TiDB Cloud y las fuentes de precios): los fallos en ellos hay que comunicarlos a cada proveedor. FondTracker es un
          proyecto personal y no ofrece recompensas económicas, pero agradeceremos públicamente tu ayuda si quieres.
        </p>
      </>
    ),
  },
  {
    id: "medidas",
    title: "Cómo protegemos la aplicación",
    body: (
      <List
        items={[
          <>{strong("Contraseñas")} guardadas como hash Argon2id, nunca en claro.</>,
          <>{strong("Sesiones")} con tokens firmados que caducan a las 24 horas; los permisos de administración se comprueban en cada petición.</>,
          <>{strong("Acceso con Google y GitHub")} con un «state» de un solo uso ligado a tu navegador, para que nadie pueda colarte en su cuenta.</>,
          <>{strong("Límites")} de intentos por IP en el acceso, el registro y otras acciones sensibles.</>,
          <>{strong("Protección frente a webs ajenas:")} la sesión viaja en una cabecera, no en una cookie que el navegador envíe solo, y las acciones que cambian datos comprueban además el origen de la petición.</>,
          <>{strong("Cabeceras de seguridad:")} política de contenido (CSP) con nonce por petición, bloqueo de marcos (X-Frame-Options), nosniff y HSTS.</>,
          <>{strong("Conexiones cifradas")} con HTTPS, y también hacia la base de datos.</>,
          <>{strong("Secretos")} (claves y contraseñas del servidor) que nunca se envían al navegador, ni siquiera al panel de administración.</>,
          <>{strong("Sin acceso a tu banco:")} FondTracker no guarda claves bancarias ni puede mover dinero.</>,
        ]}
      />
    ),
  },
];

const CONTENT: Record<View, Section[]> = { privacy: PRIVACY, terms: TERMS, security: SECURITY };

const HIGHLIGHTS = [
  { icon: EyeOff, title: "Sin conexión al banco", text: "Solo guardamos lo que apuntas" },
  { icon: KeyRound, title: "Contraseñas con Argon2id", text: "Nunca se guardan en claro" },
  { icon: Database, title: "Base de datos en la UE", text: "Frankfurt" },
  { icon: UserCheck, title: "Tus derechos RGPD", text: "Acceso, rectificación, borrado…" },
];

/** Barra superior igual que la de la landing: logo, secciones en píldora y acceso o cuenta. */
function TopBar({ user, onLogout }: { user?: User | null; onLogout?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const name = user ? user.display_name || user.username : "";
  const pill = "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-[#2f2f33] transition-colors hover:bg-white/85 sm:px-[18px] sm:py-2.5 sm:text-[14px]";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden="true"
        className={`absolute inset-0 border-b border-white/[0.08] bg-[#04050c]/75 backdrop-blur-xl transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />
      <div className="relative flex items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
        <a href="/" className="flex items-center gap-2 text-[17px] font-medium tracking-tight text-white sm:gap-2.5 sm:text-[21px]">
          <WaveLogo className="h-5 w-5 sm:h-6 sm:w-6" /> FondTracker
        </a>
        <nav aria-label="Secciones de la web" className="absolute left-1/2 hidden h-12 -translate-x-1/2 items-center gap-8 rounded-full border border-white/15 bg-white/[0.07] px-7 backdrop-blur-md md:flex">
          {[
            ["Funciones", "/#funciones"],
            ["Cómo funciona", "/#como-funciona"],
            ["Preguntas", "/#faq"],
            ["GitHub", GITHUB],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="whitespace-nowrap text-[15px] text-[#b9becf] transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-5">
          {user ? (
            <>
              <a href="/dashboard" className={pill}>
                Ir a mi panel
              </a>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Menú de la cuenta"
                  aria-expanded={menuOpen}
                  className="flex h-9 items-center gap-1 rounded-full border border-white/15 bg-white/[0.07] px-0.5 text-white backdrop-blur-md sm:h-10 sm:pl-1 sm:pr-2"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full text-[14px] font-medium">{name.slice(0, 1).toUpperCase()}</span>
                  <ChevronDown size={14} className="hidden text-[#b9becf] sm:block" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-white/15 bg-[#0c0d16]/95 p-2 shadow-2xl backdrop-blur-xl">
                    <div className="border-b border-white/10 px-3 pb-2.5 pt-1.5">
                      <p className="truncate text-[14px] font-medium text-white">{name}</p>
                      <p className="truncate text-[12px] text-[#7d8296]">{user.email}</p>
                    </div>
                    <a href="/dashboard" className="mt-1 block rounded-xl px-3 py-2 text-[14px] text-[#b9becf] hover:bg-white/[0.07] hover:text-white">
                      Mi panel
                    </a>
                    {user.is_admin && (
                      <a href="/admin" className="block rounded-xl px-3 py-2 text-[14px] text-[#b9becf] hover:bg-white/[0.07] hover:text-white">
                        Panel de admin
                      </a>
                    )}
                    <button
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-[#b9becf] hover:bg-white/[0.07] hover:text-[#f87171]"
                    >
                      <LogOut size={14} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <a href="/login" className="hidden text-[15px] text-[#b9becf] transition-colors hover:text-white sm:inline">
                Entrar
              </a>
              <a href="/register" className={pill}>
                Crear cuenta
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function LegalFooter() {
  return (
    <footer className="relative border-t border-white/[0.08] bg-[#04050c]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-10 sm:px-10">
        <div>
          <a href="/" className="flex items-center gap-2.5 text-[17px] font-medium text-white">
            <WaveLogo className="h-5 w-5" /> FondTracker
          </a>
          <p className="mt-2 text-[13px] text-[#7d8296]">© 2026 FondTracker · Licencia MIT · Hecho por Rubén Blasco Armengod</p>
        </div>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#b9becf]">
          {TABS.map((t) => (
            <a key={t.id} href={PATHS[t.id]} className="hover:text-white">
              {t.label}
            </a>
          ))}
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}

export function LegalPage({ view, user, onLogout }: LegalPageProps) {
  const [active, setActive] = useState<View>(view);
  const [current, setCurrent] = useState<string>("");
  const sections = CONTENT[active];

  useEffect(() => setActive(view), [view]);

  useEffect(() => {
    if (user) return;
    return onAuthChange((type, token) => {
      if (type === "login" && token) {
        try {
          sessionStorage.setItem("fondtracker_token", token);
        } catch {}
        window.location.reload();
      }
    });
  }, [user]);

  // Índice lateral: marca la sección que se está leyendo
  useEffect(() => {
    setCurrent(sections[0]?.id ?? "");
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  const go = (tab: View) => {
    setActive(tab);
    window.history.pushState({}, "", PATHS[tab]);
    window.scrollTo({ top: 0 });
  };

  const intro = INTRO[active];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#04050c] text-[#eef0f6] antialiased" style={{ fontFamily: '"Onest", system-ui, sans-serif' }}>
      {/* Resplandor de tinta, como el de la landing */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[560px] overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-[110px]" style={{ background: "radial-gradient(closest-side, #6f7bff, #d15bff 55%, transparent)" }} />
        <div className="absolute -top-24 left-[15%] h-[360px] w-[420px] rounded-full opacity-25 blur-[100px]" style={{ background: "radial-gradient(closest-side, #3ee0ff, transparent)" }} />
      </div>

      <TopBar user={user} onLogout={onLogout} />

      <main className="relative">
        {/* Cabecera */}
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-32 sm:px-10 sm:pt-40">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[13px] text-[#b9becf] backdrop-blur-md">
            <ShieldCheck size={14} /> Legal
          </span>
          <h1 className="mt-6 max-w-3xl text-[2.6rem] font-medium leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl">
            {intro.title}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: INK }}>
              .
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-[#b9becf] sm:text-lg">{intro.lead}</p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div role="tablist" aria-label="Documento" className="flex rounded-full border border-white/15 bg-white/[0.05] p-1 backdrop-blur-md">
              {TABS.map((t) => (
                <a
                  key={t.id}
                  href={PATHS[t.id]}
                  role="tab"
                  aria-selected={active === t.id}
                  onClick={(e) => {
                    e.preventDefault();
                    go(t.id);
                  }}
                  className={`rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${active === t.id ? "bg-white text-[#2f2f33]" : "text-[#b9becf] hover:text-white"}`}
                >
                  {t.label}
                </a>
              ))}
            </div>
            <span className="text-[13px] text-[#7d8296]">Actualizado el {UPDATED}</span>
          </div>

          {active === "privacy" && (
            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                  <Icon size={18} className="text-[#9aa3ff]" />
                  <p className="mt-3 text-[15px] font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-[13px] text-[#7d8296]">{text}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contenido con índice lateral */}
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 sm:px-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <nav aria-label="En esta página" className="sticky top-28">
              <p className="mb-3 text-[12px] font-medium uppercase tracking-wider text-[#7d8296]">En esta página</p>
              <ol className="space-y-1 border-l border-white/10">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className={`-ml-px block border-l py-1.5 pl-4 text-[14px] transition-colors ${
                        current === s.id ? "border-[#9aa3ff] text-white" : "border-transparent text-[#7d8296] hover:text-[#b9becf]"
                      }`}
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 max-w-3xl space-y-14 text-[16px] leading-[1.75] text-[#b9becf]">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28 space-y-4">
                <h2 className="flex items-baseline gap-3 text-2xl font-medium tracking-tight text-white">
                  <span className="font-mono text-[13px] text-[#7d8296]">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div>
                <p className="text-[17px] font-medium text-white">¿Dudas sobre estos textos?</p>
                <p className="text-[14px] text-[#7d8296]">Te respondemos personalmente.</p>
              </div>
              <a href={`mailto:${CONTACT}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-[#2f2f33] hover:bg-white/85">
                <Mail size={15} /> Escríbenos
              </a>
            </div>
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
