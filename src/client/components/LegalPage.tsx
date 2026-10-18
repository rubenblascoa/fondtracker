import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { User } from "../api";
import { onAuthChange } from "../api";
import { ArrowLeft, Database, EyeOff, FileText, KeyRound, Scale, Shield, UserCheck } from "lucide-react";

interface LegalPageProps {
  view: "privacy" | "terms";
  user?: User | null;
  onLogout?: () => void;
}

// Textos legales de FondTracker. Describen lo que hace el código de verdad: si cambia qué datos se
// guardan, con quién se comparten o cómo se borran, hay que actualizarlos aquí (y la fecha).
const UPDATED = "19 de octubre de 2026";
const CONTACT = "rubenblascoarmengod@gmail.com";

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-3 text-base font-semibold text-[var(--color-fg-1)] sm:text-lg">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-tag-bg)] font-mono text-xs text-[var(--color-tag-fg)]">{n}</span>
        {title}
      </h2>
      <div className="space-y-3 sm:pl-10">{children}</div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
      <table className="w-full min-w-[560px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            {head.map((h) => (
              <th key={h} className="px-3.5 py-2.5 font-semibold text-[var(--color-fg-2)]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--color-border)] align-top last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-3.5 py-2.5 ${j === 0 ? "font-medium text-[var(--color-fg-1)]" : "text-[var(--color-fg-3)]"}`}>
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

const mail = (
  <a href={`mailto:${CONTACT}`} className="font-medium text-[var(--color-fg-1)] underline underline-offset-2">
    {CONTACT}
  </a>
);

function Privacy() {
  return (
    <>
      <Section n={1} title="Quién trata tus datos">
        <p>
          FondTracker es un proyecto personal y de código abierto de <strong className="text-[var(--color-fg-1)]">Rubén Blasco Armengod</strong>, que es el responsable del tratamiento de tus datos. Para
          cualquier consulta sobre privacidad o para ejercer tus derechos, escribe a {mail}.
        </p>
      </Section>

      <Section n={2} title="Qué datos guardamos y para qué">
        <Table
          head={["Datos", "Para qué", "Base legal"]}
          rows={[
            ["Usuario, email y contraseña (guardada solo como hash Argon2id)", "Crear tu cuenta y dejarte entrar", "Ejecución del servicio que pides"],
            ["Identificador de Google o GitHub", "Entrar con esas cuentas, si lo eliges", "Ejecución del servicio"],
            ["Nombre para el saludo (opcional)", "Saludarte en el panel y en el resumen por WhatsApp", "Tu consentimiento (puedes borrarlo en Ajustes)"],
            ["Fondos que apuntas: ISIN, nombre, entidad, participaciones, precio y fecha de compra, notas y movimientos", "Calcular cuánto vale tu cartera y cómo ha ido", "Ejecución del servicio"],
            ["Foto diaria del valor de tu cartera (invertido y valor)", "Enseñarte la evolución de tu patrimonio", "Ejecución del servicio"],
            ["Teléfono, clave de CallMeBot, horas y zona horaria del resumen", "Enviarte el resumen por WhatsApp", "Tu consentimiento (lo activas y desactivas tú)"],
            ["Dirección IP", "Limitar intentos de acceso y peticiones abusivas. Solo se usa en memoria y no se guarda en la base de datos", "Interés legítimo: seguridad del servicio"],
          ]}
        />
        <p>
          FondTracker <strong className="text-[var(--color-fg-1)]">no se conecta a tu banco</strong>, no pide sus claves y no puede mover dinero: solo guarda lo que tú apuntas. No vendemos ni cedemos tus datos
          con fines publicitarios.
        </p>
      </Section>

      <Section n={3} title="Con quién se comparten">
        <p>Solo con los proveedores necesarios para que el servicio funcione, y solo con los datos que cada uno necesita:</p>
        <Table
          head={["Proveedor", "Qué recibe", "Dónde"]}
          rows={[
            ["TiDB Cloud (PingCAP)", "La base de datos completa de la aplicación", "Unión Europea (Frankfurt)"],
            ["Render", "Aloja la aplicación, por lo que procesa tus peticiones", "Proveedor de EE. UU."],
            ["CallMeBot", "Tu teléfono, tu clave y el texto de cada resumen (con el valor de tu cartera), solo si activas el WhatsApp", "Servicio de terceros"],
            ["Google / GitHub", "Los datos del inicio de sesión, solo si entras con ellos", "EE. UU."],
            ["Cloudflare Web Analytics", "Estadísticas de visitas agregadas, sin cookies", "EE. UU."],
            ["Google Fonts", "Tu dirección IP al cargar las tipografías de la web", "EE. UU."],
            ["QueFondos, Financial Times y Yahoo Finance", "Solo el ISIN o el ticker del fondo para consultar su precio. Ningún dato tuyo", "—"],
          ]}
        />
        <p>
          Cuando un proveedor está fuera del Espacio Económico Europeo, la transferencia se ampara en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión
          Europea, según el caso.
        </p>
      </Section>

      <Section n={4} title="Cuánto tiempo los guardamos">
        <p>Mientras tu cuenta esté activa.</p>
        <p>
          Si eliminas la cuenta desde Ajustes, se <strong className="text-[var(--color-fg-1)]">desactiva al momento</strong>: ya no podrás entrar, tus fondos dejan de mostrarse y dejas de recibir resúmenes.
          Los datos quedan desactivados, no borrados, por si pides recuperarla. Si quieres que se <strong className="text-[var(--color-fg-1)]">borren definitivamente</strong>, escríbenos a {mail} y lo
          haremos en un plazo máximo de un mes.
        </p>
      </Section>

      <Section n={5} title="Cookies y almacenamiento en tu navegador">
        <Table
          head={["Nombre", "Para qué", "Duración"]}
          rows={[
            [<code key="c">ft_session</code>, "Cookie técnica que mantiene tu sesión iniciada", "24 horas"],
            [<code key="s">fondtracker_token</code>, "Copia de la sesión en el almacenamiento de la pestaña", "Hasta cerrar la pestaña"],
            [<code key="t">fondtracker_theme</code>, "Recordar si prefieres el tema claro u oscuro", "Hasta que lo borres"],
          ]}
        />
        <p>No usamos cookies publicitarias ni de seguimiento. Las de esta tabla son imprescindibles para que funcione lo que pides, por eso no requieren consentimiento.</p>
      </Section>

      <Section n={6} title="Seguridad">
        <p>
          Las conexiones van cifradas con HTTPS. Las contraseñas se guardan como hash Argon2id, nunca en claro. Las sesiones usan tokens firmados que caducan. La base de datos exige conexión cifrada.
          Los permisos de administración se comprueban en cada petición. Ningún sistema es infalible: si detectas un fallo de seguridad, escríbenos a {mail}.
        </p>
      </Section>

      <Section n={7} title="Tus derechos">
        <p>
          Puedes pedir acceder a tus datos, rectificarlos, borrarlos, limitar u oponerte a su uso y llevártelos (portabilidad). Buena parte lo puedes hacer tú mismo:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Corregir tu nombre, email, teléfono y contraseña en Ajustes.</li>
          <li>Editar o borrar tus fondos en Mi cartera.</li>
          <li>Descargar una copia completa en JSON desde Informes.</li>
        </ul>
        <p>
          Para todo lo demás, escribe a {mail}; respondemos en un mes como máximo. Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos
          (aepd.es).
        </p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <Section n={1} title="Qué es FondTracker">
        <p>
          FondTracker es una herramienta gratuita para apuntar los fondos de inversión y ETFs que tienes en distintas entidades y ver cuánto valen. La ofrece Rubén Blasco Armengod ({mail}) como proyecto
          personal. Al crear una cuenta o usar el servicio aceptas estos términos.
        </p>
      </Section>

      <Section n={2} title="No es asesoramiento financiero">
        <div className="rounded-xl border border-[var(--color-warn)]/25 bg-[var(--color-warn)]/10 p-4 text-[var(--color-fg-2)]">
          FondTracker no es una entidad financiera ni un asesor de inversiones. Nada de lo que muestra es una recomendación para comprar, vender o mantener ningún producto. Las decisiones de inversión son
          solo tuyas.
        </div>
      </Section>

      <Section n={3} title="Precios y cálculos">
        <p>
          Los precios se obtienen de fuentes públicas de terceros: QueFondos (valor liquidativo de los fondos españoles), Financial Times (histórico diario) y Yahoo Finance (ETFs). Las gestoras publican
          el valor liquidativo con días de retraso y esas fuentes pueden tener errores o dejar de estar disponibles. Por eso cada fondo enseña la fecha del precio que se usa.
        </p>
        <p>
          Los cálculos (valor, ganancia, rentabilidad, evolución) dependen de los datos que apuntas tú. El simulador de IRPF es orientativo: no tiene en cuenta tu situación fiscal completa y no sustituye
          a tu declaración ni a un asesor fiscal. Comprueba siempre las cifras con los extractos de tu entidad.
        </p>
      </Section>

      <Section n={4} title="Resumen por WhatsApp">
        <p>
          El resumen se envía a través de CallMeBot, un servicio de terceros que tú activas con tu propia clave. Su funcionamiento no depende de FondTracker: puede retrasarse, fallar o dejar de prestarse.
          Puedes desactivarlo cuando quieras.
        </p>
      </Section>

      <Section n={5} title="Tu cuenta">
        <ul className="list-disc space-y-1 pl-5">
          <li>Eres responsable de la exactitud de los datos que apuntas y de proteger el acceso a tu cuenta.</li>
          <li>
            No está permitido intentar acceder a cuentas o datos ajenos, saturar el servicio ni usarlo para fines ilícitos. Si ocurre, podremos suspender la cuenta. Las cuentas desactivadas pueden
            restaurarse.
          </li>
          <li>Puedes dejar de usar el servicio y eliminar tu cuenta cuando quieras desde Ajustes (ver la política de privacidad).</li>
        </ul>
      </Section>

      <Section n={6} title="Disponibilidad y responsabilidad">
        <p>
          El servicio se ofrece gratis y «tal cual», sin garantía de disponibilidad continua ni de que esté libre de errores. Puede cambiar o dejar de prestarse; si se cierra, se avisará con antelación
          razonable para que puedas descargar tus datos. Dentro de lo que permite la ley, no respondemos de pérdidas derivadas de decisiones tomadas con la información mostrada.
        </p>
      </Section>

      <Section n={7} title="Código abierto">
        <p>
          El código de FondTracker es público en GitHub bajo licencia MIT. Esa licencia regula el uso del código; estos términos regulan el uso del servicio publicado en esta web.
        </p>
      </Section>

      <Section n={8} title="Cambios y legislación">
        <p>
          Si estos términos cambian de forma relevante, se avisará en la web y se actualizará la fecha de arriba. Se rigen por la ley española. Si eres consumidor, conservas los derechos y el fuero que te
          reconoce la normativa de consumo.
        </p>
      </Section>
    </>
  );
}

const HIGHLIGHTS = [
  { icon: EyeOff, title: "Sin conexión al banco", text: "Solo guardamos lo que apuntas" },
  { icon: KeyRound, title: "Contraseñas con Argon2id", text: "Nunca se guardan en claro" },
  { icon: Database, title: "Base de datos en la UE", text: "Frankfurt" },
  { icon: UserCheck, title: "Tus derechos RGPD", text: "Acceso, rectificación, borrado…" },
];

export function LegalPage({ view, user, onLogout }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">(view);
  const isPrivacy = activeTab === "privacy";

  useEffect(() => {
    setActiveTab(view);
  }, [view]);

  useEffect(() => {
    if (user) return;
    const unsubscribe = onAuthChange((type, token) => {
      if (type === "login" && token) {
        try {
          sessionStorage.setItem("fondtracker_token", token);
        } catch {}
        window.location.reload();
      }
    });
    return unsubscribe;
  }, [user]);

  const go = (tab: "privacy" | "terms") => {
    setActiveTab(tab);
    window.history.pushState({}, "", tab === "privacy" ? "/legal/privacy-policy" : "/legal/terms-of-service");
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col bg-[var(--color-ink-0)] font-sans text-[var(--color-fg-1)]">
      <Header user={user} onLogout={onLogout} landingNav />

      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8 sm:py-14">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={user ? "/dashboard" : "/"}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-medium text-[var(--color-fg-3)] transition-colors hover:text-[var(--color-fg-1)]"
            >
              <ArrowLeft size={13} /> Volver {user ? "al panel" : "al inicio"}
            </a>
            <span className="text-xs text-[var(--color-fg-4)]">Última actualización: {UPDATED}</span>
          </div>

          <div className="ft-card space-y-6 p-5 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{isPrivacy ? "Política de privacidad" : "Términos de uso"}</h1>
                <p className="mt-1 text-sm text-[var(--color-fg-3)]">
                  {isPrivacy ? "Qué datos guardamos, para qué, con quién se comparten y cómo ejercer tus derechos." : "Las condiciones para usar FondTracker y lo que el servicio es y no es."}
                </p>
              </div>
              <div className="flex shrink-0 gap-1 rounded-full border border-[var(--color-border)] p-1" role="tablist">
                {(
                  [
                    ["privacy", "Privacidad", Shield],
                    ["terms", "Términos", FileText],
                  ] as const
                ).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => go(id)}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                      activeTab === id ? "bg-[var(--color-fg-1)] text-[var(--color-ink-0)]" : "text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {isPrivacy && (
              <div className="grid grid-cols-2 gap-2.5 border-t border-[var(--color-border)] pt-5 sm:grid-cols-4">
                {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                    <Icon size={16} className="text-[var(--color-accent)]" />
                    <p className="mt-2 text-[13px] font-semibold text-[var(--color-fg-1)]">{title}</p>
                    <p className="text-[11px] text-[var(--color-fg-4)]">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <article className="ft-card space-y-8 p-5 text-sm leading-relaxed text-[var(--color-fg-3)] sm:p-8">{isPrivacy ? <Privacy /> : <Terms />}</article>

          <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-fg-4)]">
            <Scale size={13} /> ¿Dudas sobre estos textos? Escribe a {mail}.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
