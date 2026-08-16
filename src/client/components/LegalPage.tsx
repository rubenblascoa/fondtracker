import React, { useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { User } from "../api";
import { onAuthChange } from "../api";
import { 
  ShieldCheck, FileText, Lock, Eye, Trash2, Globe, 
  ArrowLeft, CheckCircle2, AlertTriangle, Shield, Scale
} from "lucide-react";

interface LegalPageProps {
  view: "privacy" | "terms";
  user?: User | null;
  onLogout?: () => void;
}

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
        try { sessionStorage.setItem("fondtracker_token", token); } catch {}
        window.location.reload();
      }
    });
    return unsubscribe;
  }, [user]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans relative z-10">
      <Header user={user} onLogout={onLogout} landingNav />

      {/* Ambient Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[var(--color-accent)]/5 blur-[140px] rounded-full pointer-events-none" />

      <main className="flex-1 flex flex-col items-center px-4 py-8 sm:py-16 relative z-10">
        <div className="w-full max-w-4xl space-y-6">

          {/* Top Return Link */}
          <div className="flex items-center justify-between">
            <a 
              href={user ? "/dashboard" : "/"} 
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-[var(--color-accent)] transition-colors px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5"
            >
              <ArrowLeft size={13} />
              <span>Volver {user ? "al Dashboard" : "al Inicio"}</span>
            </a>

            <span className="text-[11px] font-mono text-gray-500">
              Última actualización: Agosto 2026
            </span>
          </div>

          {/* Header Card with Tab Switcher */}
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-semibold mb-3">
                  {isPrivacy ? <ShieldCheck size={13} /> : <Scale size={13} />}
                  <span>Documentación Legal Oficial</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-fg-1)] tracking-tight">
                  {isPrivacy ? "Política de Privacidad y RGPD" : "Términos y Condiciones de Uso"}
                </h1>
                <p className="text-xs text-[var(--color-fg-4)] mt-1">
                  {isPrivacy 
                    ? "Transparencia total sobre cómo protegemos tu identidad, finanzas y credenciales." 
                    : "Condiciones de servicio, exenciones financieras y uso de la plataforma FondTracker."}
                </p>
              </div>

              {/* Tab Selector Buttons */}
              <div className="flex items-center gap-1.5 p-1.5 bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-2xl shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("privacy");
                    window.history.pushState({}, "", "/legal/privacy-policy");
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isPrivacy
                      ? "bg-[var(--color-accent)] text-[#0a0a0c] shadow-[0_0_12px_rgba(57,255,136,0.25)] font-bold"
                      : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-3)]/50"
                  }`}
                >
                  <Shield size={13} />
                  <span>Privacidad</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("terms");
                    window.history.pushState({}, "", "/legal/terms-of-service");
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    !isPrivacy
                      ? "bg-[var(--color-accent)] text-[#0a0a0c] shadow-[0_0_12px_rgba(57,255,136,0.25)] font-bold"
                      : "text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] hover:bg-[var(--color-ink-3)]/50"
                  }`}
                >
                  <FileText size={13} />
                  <span>Términos</span>
                </button>
              </div>
            </div>

            {/* Quick Guarantee Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--color-ink-3)]">
              <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3 text-center">
                <Lock size={16} className="text-[var(--color-accent)] mx-auto mb-1" />
                <span className="text-xs text-[var(--color-fg-1)] font-semibold block">Cifrado bcrypt & JWT</span>
                <span className="text-[10px] text-[var(--color-fg-4)]">Contraseñas seguras</span>
              </div>
              <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3 text-center">
                <Eye size={16} className="text-blue-500 mx-auto mb-1" />
                <span className="text-xs text-[var(--color-fg-1)] font-semibold block">Cero Venta de Datos</span>
                <span className="text-[10px] text-[var(--color-fg-4)]">100% privado</span>
              </div>
              <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3 text-center">
                <Globe size={16} className="text-[var(--color-warn)] mx-auto mb-1" />
                <span className="text-xs text-[var(--color-fg-1)] font-semibold block">Regulación UE</span>
                <span className="text-[10px] text-[var(--color-fg-4)]">Conforme al RGPD</span>
              </div>
              <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] rounded-xl p-3 text-center">
                <Trash2 size={16} className="text-[var(--color-danger)] mx-auto mb-1" />
                <span className="text-xs text-[var(--color-fg-1)] font-semibold block">Derecho al Olvido</span>
                <span className="text-[10px] text-[var(--color-fg-4)]">Borrado en 1 clic</span>
              </div>
            </div>

          </div>

          {/* Main Legal Content Container */}
          <div className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl space-y-8 text-xs sm:text-sm text-[var(--color-fg-3)] leading-relaxed">
            {isPrivacy ? (
              <>
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">1</span>
                    Introducción y Alcance
                  </h2>
                  <p>
                    Bienvenido a <strong>FondTracker</strong>. Respetamos rigurosamente tu privacidad y estamos firmemente comprometidos con la protección de tus datos personales. Esta Política de Privacidad explica cómo tratamos tu información cuando interactúas con nuestra plataforma web y servicios automatizados de reporte, bajo el marco del Reglamento General de Protección de Datos (RGPD) de la Unión Europea.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">2</span>
                    Responsable del Tratamiento
                  </h2>
                  <p>
                    FondTracker actúa como Responsable del Tratamiento de los datos proporcionados por el usuario. Si tienes cualquier consulta o deseas ejercer tus derechos legales, puedes comunicarte en cualquier momento a través del correo de soporte oficial indicado en el pie de página.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">3</span>
                    Datos Recopilados y Finalidad
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] p-3.5 rounded-2xl">
                      <p className="font-semibold text-[var(--color-fg-1)] mb-1">👤 Datos de Identidad</p>
                      <p className="text-xs text-[var(--color-fg-4)]">Nombre de usuario y credenciales cifradas (passwords procesados mediante función unidireccional bcrypt con salt).</p>
                    </div>
                    <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] p-3.5 rounded-2xl">
                      <p className="font-semibold text-[var(--color-fg-1)] mb-1">📧 Datos de Contacto</p>
                      <p className="text-xs text-[var(--color-fg-4)]">Email para autenticación y recuperación. Teléfono móvil exclusivamente para el envío de alertas de WhatsApp si decides activarlo.</p>
                    </div>
                    <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] p-3.5 rounded-2xl">
                      <p className="font-semibold text-[var(--color-fg-1)] mb-1">💼 Datos de Inversión</p>
                      <p className="text-xs text-[var(--color-fg-4)]">Códigos ISIN, número de participaciones y precios de compra añadidos manualmente por ti. <strong>Nunca</strong> nos conectamos a tus claves bancarias.</p>
                    </div>
                    <div className="bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] p-3.5 rounded-2xl">
                      <p className="font-semibold text-[var(--color-fg-1)] mb-1">🛡️ Datos Técnicos y Logs</p>
                      <p className="text-xs text-[var(--color-fg-4)]">Dirección IP y fecha de sesión empleados únicamente para prevención de ataques por fuerza bruta y protección de la cuenta.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">4</span>
                    Seguridad y Almacenamiento
                  </h2>
                  <p>
                    Implementamos salvaguardas técnicas y organizativas de estándar bancario: cifrado en tránsito mediante TLS 1.3, autenticación con tokens JWT temporales y bases de datos alojadas en centros de datos con certificación ISO/IEC 27001 dentro de la Unión Europea.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">5</span>
                    Servicios de Terceros y WhatsApp
                  </h2>
                  <p>
                    Para obtener cotizaciones de mercado en tiempo real, consultamos APIs públicas (Yahoo Finance y QueFondos) enviando únicamente códigos de fondo anónimos (ISINs o tickers). Si configuras el bot de WhatsApp, tus resúmenes diarios se transmiten mediante la pasarela segura autorizada por ti. En ningún caso comercializamos, alquilamos ni cedemos tus datos a intermediarios publicitarios.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">6</span>
                    Tus Derechos (Derecho al Olvido)
                  </h2>
                  <p>
                    De conformidad con el RGPD, puedes acceder, rectificar o eliminar toda tu información en cualquier momento desde el menú de Ajustes del Dashboard. Al solicitar la eliminación de la cuenta, todos tus datos e historial de inversiones son borrados permanentemente de forma instantánea e irreversible.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">1</span>
                    Aceptación de los Términos
                  </h2>
                  <p>
                    Al registrarte, acceder o utilizar FondTracker (el "Servicio"), manifiestas tu conformidad con los presentes Términos de Servicio. Si no estás de acuerdo con cualquiera de estas cláusulas, no estás autorizado a hacer uso de la plataforma.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">2</span>
                    Naturaleza del Servicio y Aviso Financiero
                  </h2>
                  <div className="bg-[var(--color-warn)]/10 border border-[var(--color-warn)]/20 p-4 rounded-2xl text-xs space-y-2 text-[var(--color-fg-2)]">
                    <p className="font-bold text-[var(--color-warn)] flex items-center gap-1.5">
                      <AlertTriangle size={14} /> AVISO LEGAL IMPORTANTE:
                    </p>
                    <p>
                      FondTracker es exclusivamente una herramienta informática de seguimiento y analítica de datos personales. <strong>FONDTRACKER NO ES UNA ENTIDAD FINANCIERA, SOCIEDAD DE VALORES NI ASESOR DE INVERSIONES.</strong>
                    </p>
                    <p>
                      Ninguna información mostrada constituye una recomendación, oferta ni asesoramiento de compra o venta de productos financieros. Todas las decisiones de inversión son de exclusiva responsabilidad del usuario.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">3</span>
                    Exactitud y Proveedores de Precios
                  </h2>
                  <p>
                    Los valores liquidativos y precios mostrados provienen de fuentes de terceros (como Yahoo Finance y registros públicos de entidades gestoras). Aunque empleamos algoritmos de verificación cruzada y caché de alta disponibilidad, los precios pueden presentar desfases respecto a la cotización oficial de cierre de cada gestora.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">4</span>
                    Uso Aceptable y Responsabilidad
                  </h2>
                  <p>
                    Te comprometes a hacer un uso lícito de la plataforma, evitando intentos de vulneración de seguridad, ingeniería inversa, scraping masivo no autorizado o suplantación de identidad. Nos reservamos el derecho de suspender o revocar el acceso a cuentas que infrinjan estas normas de convivencia.
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-base sm:text-lg font-bold text-[var(--color-fg-1)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-xs font-mono">5</span>
                    Legislación y Jurisdicción
                  </h2>
                  <p>
                    Estos Términos se rigen e interpretan con arreglo a las leyes de España y la Unión Europea. Cualquier controversia derivada del uso del Servicio será dirimida en los tribunales competentes del territorio español.
                  </p>
                </section>
              </>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
