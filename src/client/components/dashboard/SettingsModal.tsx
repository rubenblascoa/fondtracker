import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, clearToken, type User } from "../../api";
import { AlertTriangle, Check, CheckCircle2, Lock, Mail, MessageCircle, Moon, Palette, Sun, Trash2, UserRound, X } from "lucide-react";
import { COUNTRIES } from "../RegisterPage";
import { useTheme } from "../../theme";

type Props = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
};

type Tab = "profile" | "appearance" | "phone" | "email" | "password" | "danger";

const SECTIONS: Record<Tab, { label: string; title: string; description: string; icon: typeof UserRound }> = {
  profile: { label: "Perfil", title: "Perfil", description: "Cómo te llamamos en el panel y en el resumen por WhatsApp.", icon: UserRound },
  appearance: { label: "Apariencia", title: "Apariencia", description: "Elige cómo se ve tu panel. La web pública y el acceso se ven siempre en oscuro.", icon: Palette },
  phone: { label: "WhatsApp", title: "Teléfono de WhatsApp", description: "El número donde recibes el resumen diario de tu cartera.", icon: MessageCircle },
  email: { label: "Email", title: "Email", description: "Con este email entras en FondTracker.", icon: Mail },
  password: { label: "Contraseña", title: "Contraseña", description: "Cambia la contraseña con la que entras.", icon: Lock },
  danger: { label: "Eliminar cuenta", title: "Eliminar cuenta", description: "Cierra tu cuenta y deja de mostrar tus fondos.", icon: Trash2 },
};
const MAIN_TABS: Tab[] = ["profile", "appearance", "phone", "email", "password"];

const inputClass =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-2)] px-3.5 py-2.5 text-sm text-[var(--color-fg-1)] outline-none transition-colors placeholder:text-[var(--color-fg-4)] focus:border-[var(--color-accent)]";

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-[var(--color-fg-2)]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-[var(--color-fg-4)]">{hint}</p>}
    </div>
  );
}

export function SettingsModal({ user, isOpen, onClose }: Props) {
  const { isDark, isLight, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("profile");

  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [phoneCountry, setPhoneCountry] = useState(() => COUNTRIES.find((c) => c.code === "ES") ?? COUNTRIES[0]);
  const [localPhone, setLocalPhone] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Teléfono guardado → prefijo del país + número
  useEffect(() => {
    if (!user?.phone) return setLocalPhone("");
    const country = COUNTRIES.slice().sort((a, b) => b.dial.length - a.dial.length).find((c) => user.phone!.startsWith(c.dial));
    if (country) {
      setPhoneCountry(country);
      setLocalPhone(user.phone.slice(country.dial.length));
    } else {
      setLocalPhone(user.phone);
    }
  }, [user?.phone]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => countryRef.current && !countryRef.current.contains(e.target as Node) && setShowCountryPicker(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const goTo = (next: Tab) => {
    setTab(next);
    setError("");
    setSuccess("");
  };

  /** Ejecuta un guardado mostrando el resultado al lado del botón. */
  const run = async (action: () => Promise<string>) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      setSuccess(await action());
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  const saveName = () =>
    run(async () => {
      const clean = displayName.trim().replace(/\s+/g, " ");
      await api.updateAccount({ display_name: clean });
      user.display_name = clean || null;
      setDisplayName(clean);
      return clean ? "Nombre guardado" : "Nombre borrado: usaremos tu usuario";
    });

  const savePhone = () => {
    const num = localPhone.replace(/\D/g, "");
    const full = num ? `${phoneCountry.dial}${num}` : "";
    if (num && !/^\+[1-9]\d{6,14}$/.test(full)) return setError("Número no válido. Ejemplo: 612345678");
    return run(async () => {
      await api.updateAccount({ phone: full || null });
      user.phone = full || null;
      return full ? "Teléfono guardado" : "Teléfono borrado";
    });
  };

  const saveEmail = () => {
    if (!currentEmail.includes("@") || !newEmail.includes("@")) return setError("Escribe tu email actual y el nuevo");
    return run(async () => {
      await api.updateAccount({ currentEmail: currentEmail.trim(), email: newEmail.trim() });
      user.email = newEmail.trim();
      setCurrentEmail("");
      setNewEmail("");
      return "Email actualizado";
    });
  };

  const savePassword = () => {
    if (!currentPassword || !newPassword) return setError("Rellena las dos contraseñas");
    if (newPassword.length < 8) return setError("La nueva contraseña necesita al menos 8 caracteres");
    return run(async () => {
      await api.updateAccount({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      return "Contraseña cambiada";
    });
  };

  const deleteAccount = async () => {
    if (!deletePassword) return setError("Escribe tu contraseña para confirmar");
    setError("");
    setLoading(true);
    try {
      await api.deleteAccount(deletePassword);
      clearToken();
      window.location.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const section = SECTIONS[tab];
  const shownName = user.display_name || user.username;
  const action: { label: string; onClick: () => void; danger?: boolean } | null =
    tab === "profile" ? { label: "Guardar nombre", onClick: saveName }
    : tab === "phone" ? { label: "Guardar teléfono", onClick: savePhone }
    : tab === "email" ? { label: "Cambiar email", onClick: saveEmail }
    : tab === "password" ? { label: "Cambiar contraseña", onClick: savePassword }
    : tab === "danger" ? { label: "Eliminar mi cuenta", onClick: deleteAccount, danger: true }
    : null;

  const navItem = (id: Tab) => {
    const { label, icon: Icon } = SECTIONS[id];
    const active = tab === id;
    const danger = id === "danger";
    return (
      <button
        key={id}
        onClick={() => goTo(id)}
        aria-current={active ? "page" : undefined}
        className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors sm:w-full ${
          active
            ? danger
              ? "bg-[var(--color-loss)]/12 text-[var(--color-loss)]"
              : "bg-[var(--color-surface)] text-[var(--color-fg-1)] ring-1 ring-[var(--color-border)]"
            : danger
              ? "text-[var(--color-fg-4)] hover:text-[var(--color-loss)]"
              : "text-[var(--color-fg-3)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]"
        }`}
      >
        <Icon size={16} className={active && !danger ? "text-[var(--color-accent)]" : ""} />
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-md sm:p-6 fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="flex h-[min(620px,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-ink-1)] shadow-[0_30px_80px_rgba(0,0,0,0.6)] sm:flex-row"
      >
        {/* Menú: lateral en escritorio, fila deslizable en móvil */}
        <aside className="shrink-0 border-b border-[var(--color-border)] sm:flex sm:w-60 sm:flex-col sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-3 px-5 pb-3 pt-5 sm:pb-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-tag-bg)] font-heading text-base font-semibold text-[var(--color-tag-fg)]">
              {shownName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-fg-1)]">{shownName}</p>
              <p className="truncate text-xs text-[var(--color-fg-4)]">{user.email}</p>
            </div>
            <button onClick={onClose} aria-label="Cerrar ajustes" className="rounded-full p-2 text-[var(--color-fg-4)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)] sm:hidden">
              <X size={18} />
            </button>
          </div>
          <nav aria-label="Secciones de ajustes" className="flex gap-1 overflow-x-auto px-3 pb-3 no-scrollbar sm:flex-1 sm:flex-col sm:overflow-visible sm:pb-0">
            {MAIN_TABS.map(navItem)}
            <div className="hidden flex-1 sm:block" />
            <div className="sm:border-t sm:border-[var(--color-border)] sm:py-3">{navItem("danger")}</div>
          </nav>
        </aside>

        {/* Contenido de la sección */}
        <section className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
            <div>
              <h2 id="settings-title" className={`font-heading text-xl font-semibold ${tab === "danger" ? "text-[var(--color-loss)]" : "text-[var(--color-fg-1)]"}`}>
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-fg-3)]">{section.description}</p>
            </div>
            <button onClick={onClose} aria-label="Cerrar ajustes" className="hidden rounded-full p-2 text-[var(--color-fg-4)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)] sm:block">
              <X size={18} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
            {tab === "profile" && (
              <Field label="Tu nombre" htmlFor="display-name" hint={`Si lo dejas vacío, usamos tu usuario (${user.username}).`}>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  maxLength={40}
                  autoComplete="given-name"
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  placeholder="Escribe tu nombre"
                  className={inputClass}
                />
              </Field>
            )}

            {tab === "appearance" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { id: "dark" as const, label: "Oscuro", note: "Predeterminado", active: isDark, Icon: Moon, preview: "bg-[#0b0b0a] border-white/10", bar: "bg-white/25", card: "bg-white/[.06] border-white/10" },
                  { id: "light" as const, label: "Claro", note: "Fondo claro", active: isLight, Icon: Sun, preview: "bg-white border-black/10", bar: "bg-black/25", card: "bg-black/[.04] border-black/10" },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTheme(o.id)}
                    aria-pressed={o.active}
                    className={`rounded-2xl border p-3 text-left transition-colors ${
                      o.active ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]" : "border-[var(--color-border)] hover:border-[var(--color-fg-4)]"
                    }`}
                  >
                    <div className={`h-24 rounded-xl border p-3 ${o.preview}`}>
                      <div className={`h-2 w-16 rounded ${o.bar}`} />
                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        <div className="h-9 rounded-md" style={{ background: "linear-gradient(140deg,#0e7fa3,#4b4fd6,#9b36c9)" }} />
                        <div className={`h-9 rounded-md border ${o.card}`} />
                        <div className={`h-9 rounded-md border ${o.card}`} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between px-1">
                      <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-fg-1)]">
                        <o.Icon size={15} /> {o.label}
                        <span className="text-xs font-normal text-[var(--color-fg-4)]">· {o.note}</span>
                      </span>
                      {o.active && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-fg)]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tab === "phone" && (
              <Field label="Número de teléfono" htmlFor="settings-phone" hint="Para recibirlo necesitas también tu clave de CallMeBot (sección WhatsApp). Déjalo vacío para no recibir nada.">
                <div className="relative flex gap-2" ref={countryRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker((v) => !v)}
                    aria-label={`Prefijo ${phoneCountry.dial}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-2)] px-3 text-sm text-[var(--color-fg-1)] hover:border-[var(--color-fg-4)]"
                  >
                    <span>{phoneCountry.flag}</span>
                    <span className="font-mono text-xs text-[var(--color-fg-3)]">{phoneCountry.dial}</span>
                  </button>
                  {showCountryPicker && (
                    <div className="absolute left-0 top-full z-10 mt-2 max-h-60 w-72 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink-2)] p-2 shadow-2xl">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar país…"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="mb-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-1)] px-2.5 py-1.5 text-xs text-[var(--color-fg-1)] outline-none"
                      />
                      {COUNTRIES.filter((c) => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch)).map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setPhoneCountry(c);
                            setShowCountryPicker(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-[var(--color-fg-2)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]"
                        >
                          <span>{c.flag}</span>
                          <span className="w-10 font-mono text-[10px] text-[var(--color-fg-4)]">{c.dial}</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    id="settings-phone"
                    type="tel"
                    inputMode="numeric"
                    value={localPhone}
                    onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && savePhone()}
                    placeholder="612345678"
                    className={inputClass}
                  />
                </div>
              </Field>
            )}

            {tab === "email" && (
              <>
                <Field label="Email actual" htmlFor="settings-email-current">
                  <input id="settings-email-current" type="email" autoComplete="email" value={currentEmail} onChange={(e) => setCurrentEmail(e.target.value)} placeholder={user.email} className={inputClass} />
                </Field>
                <Field label="Nuevo email" htmlFor="settings-email-new">
                  <input id="settings-email-new" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nuevo@email.com" className={inputClass} />
                </Field>
              </>
            )}

            {tab === "password" && (
              <>
                <Field label="Contraseña actual" htmlFor="settings-pw-current">
                  <input id="settings-pw-current" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Nueva contraseña" htmlFor="settings-pw-new" hint="Al menos 8 caracteres, con mayúscula, minúscula y número.">
                  <input id="settings-pw-new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                </Field>
              </>
            )}

            {tab === "danger" && (
              <>
                <div className="flex gap-3 rounded-2xl border border-[var(--color-loss)]/25 bg-[var(--color-loss)]/8 p-4 text-sm text-[var(--color-fg-2)]">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[var(--color-loss)]" />
                  <p>Tu cuenta y tus fondos se desactivan al momento y ya no podrás entrar ni recibir el resumen por WhatsApp. Tú no podrás deshacerlo desde la web.</p>
                </div>
                <Field label="Escribe tu contraseña para confirmar" htmlFor="settings-delete">
                  <input
                    id="settings-delete"
                    type="password"
                    autoComplete="current-password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={`${inputClass} focus:border-[var(--color-loss)]`}
                  />
                </Field>
              </>
            )}
          </div>

          {/* Pie: resultado y acción de la sección */}
          {(action || error || success) && (
            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              {error && (
                <p className="mr-auto flex items-center gap-1.5 text-xs text-[var(--color-loss)]">
                  <AlertTriangle size={14} className="shrink-0" /> {error}
                </p>
              )}
              {success && !error && (
                <p className="mr-auto flex items-center gap-1.5 text-xs text-[var(--color-profit)]">
                  <CheckCircle2 size={14} className="shrink-0" /> {success}
                </p>
              )}
              {action && (
                <button
                  onClick={action.onClick}
                  disabled={loading}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 ${
                    action.danger ? "bg-[var(--color-loss)] text-white" : "bg-[var(--color-btn-bg)] text-[var(--color-btn-fg)]"
                  }`}
                >
                  {loading ? "Un momento…" : action.label}
                </button>
              )}
            </footer>
          )}
        </section>
      </div>
    </div>
  );
}
