import { useState, useRef, useEffect } from "react";
import type { Status, User } from "../api";
import { api, clearToken } from "../api";

type Props = {
  status: Status | null;
  user: User;
  onLogout: () => void;
};

export function Header({ status, user, onLogout, onOpenApiDocs }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<"menu" | "email" | "password" | "delete" | null>(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setTimeout(() => setView(null), 200);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function openView(v: "email" | "password" | "delete") {
    setView(v);
    setError("");
    setEmail("");
    setCurrentPassword("");
    setNewPassword("");
  }

  async function handleChangeEmail() {
    setError("");
    if (!email.includes("@")) { setError("Email inválido"); return; }
    setLoading(true);
    try {
      await api.updateAccount({ email: email.trim() });
      setView(null);
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setError("");
    if (!currentPassword || !newPassword) { setError("Rellena ambos campos"); return; }
    if (newPassword.length < 6) { setError("La nueva contraseña necesita al menos 6 caracteres"); return; }
    setLoading(true);
    try {
      await api.updateAccount({ currentPassword, newPassword });
      setView(null);
      setMenuOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setError("");
    if (!currentPassword) { setError("Introduce tu contraseña"); return; }
    setLoading(true);
    try {
      await api.deleteAccount(currentPassword);
      clearToken();
      window.location.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="border-b border-[var(--color-ink-3)] bg-[var(--color-ink-0)]/90 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <svg
            width="24"
            height="24"
            viewBox="0 0 32 32"
            shapeRendering="crispEdges"
            className="text-[var(--color-accent)] shrink-0"
          >
            <rect x="6" y="20" width="4" height="6" fill="currentColor" />
            <rect x="12" y="14" width="4" height="12" fill="currentColor" />
            <rect x="18" y="8" width="4" height="18" fill="currentColor" />
            <rect x="24" y="4" width="4" height="22" fill="currentColor" />
            <rect x="4" y="28" width="26" height="2" fill="currentColor" />
          </svg>
          <div className="leading-tight">
            <h1 className="font-pixel text-base text-[var(--color-fg-1)] glow leading-none">
              FONDTRACKER
            </h1>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--color-fg-4)] mt-0.5">
              investment tracker
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-5 text-xs text-[var(--color-fg-3)]">
          <StatusPill
            label="WhatsApp"
            ok={Boolean(status?.whatsapp.configured)}
            value={
              status?.whatsapp.configured ? "conectado" : "offline"
            }
          />
          <div className="hidden md:flex items-baseline gap-1.5 text-[10px] whitespace-nowrap">
            <span className="text-[var(--color-fg-4)]">
              {status?.fund_count ?? 0}
            </span>
            <span className="text-[var(--color-fg-4)]">
              {(status?.fund_count ?? 0) === 1 ? "fondo" : "fondos"}
            </span>
          </div>
          <div className="flex items-center gap-3 border-l border-[var(--color-ink-3)] pl-4" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-5 h-5 bg-[var(--color-ink-3)] border border-[var(--color-ink-4)] flex items-center justify-center text-[9px] text-[var(--color-accent)] font-pixel">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-[11px] text-[var(--color-fg-2)] hidden sm:inline">
                  {user.username}
                </span>
              </button>

              {menuOpen && !view && (
                <div className="absolute right-0 top-full mt-2 w-44 border border-[var(--color-ink-3)] bg-[var(--color-ink-0)] shadow-lg z-50">
                  <button onClick={() => openView("email")} className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-fg-3)] hover:bg-[var(--color-ink-2)] hover:text-[var(--color-fg-1)] transition-colors">
                    cambiar email
                  </button>
                  <button onClick={() => openView("password")} className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-fg-3)] hover:bg-[var(--color-ink-2)] hover:text-[var(--color-fg-1)] transition-colors">
                    cambiar contraseña
                  </button>
                  <div className="border-t border-[var(--color-ink-3)]" />
                  <button onClick={onLogout} className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-fg-3)] hover:bg-[var(--color-ink-2)] hover:text-[var(--color-danger)] transition-colors">
                    cerrar sesión
                  </button>
                  <button onClick={() => openView("delete")} className="w-full text-left px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors">
                    eliminar cuenta
                  </button>
                </div>
              )}

              {menuOpen && view === "email" && (
                <div className="absolute right-0 top-full mt-2 w-64 border border-[var(--color-ink-3)] bg-[var(--color-ink-0)] shadow-lg z-50 p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] mb-3">cambiar email</h3>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nuevo email" className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg-1)] outline-none focus:border-[var(--color-accent)] transition-colors mb-2" autoFocus />
                  {error && <p className="text-[10px] text-[var(--color-danger)] font-mono mb-2">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] px-2 py-1 transition-colors">cancelar</button>
                    <button onClick={handleChangeEmail} disabled={loading || !email} className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 px-2 py-1 disabled:opacity-30 transition-colors">{loading ? "..." : "guardar"}</button>
                  </div>
                </div>
              )}

              {menuOpen && view === "password" && (
                <div className="absolute right-0 top-full mt-2 w-64 border border-[var(--color-ink-3)] bg-[var(--color-ink-0)] shadow-lg z-50 p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] mb-3">cambiar contraseña</h3>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="contraseña actual" className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg-1)] outline-none focus:border-[var(--color-accent)] transition-colors mb-2" autoFocus />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="nueva contraseña (mín. 6)" className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg-1)] outline-none focus:border-[var(--color-accent)] transition-colors mb-2" />
                  {error && <p className="text-[10px] text-[var(--color-danger)] font-mono mb-2">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] px-2 py-1 transition-colors">cancelar</button>
                    <button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword} className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 px-2 py-1 disabled:opacity-30 transition-colors">{loading ? "..." : "guardar"}</button>
                  </div>
                </div>
              )}

              {menuOpen && view === "delete" && (
                <div className="absolute right-0 top-full mt-2 w-64 border border-[var(--color-ink-3)] bg-[var(--color-ink-0)] shadow-lg z-50 p-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-danger)] mb-3">eliminar cuenta</h3>
                  <p className="text-[10px] text-[var(--color-fg-4)] font-mono mb-3">Esta acción es irreversible. Todos tus datos serán eliminados.</p>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="confirma tu contraseña" className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] px-2 py-1.5 text-xs font-mono text-[var(--color-fg-1)] outline-none focus:border-[var(--color-danger)] transition-colors mb-2" autoFocus />
                  {error && <p className="text-[10px] text-[var(--color-danger)] font-mono mb-2">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)] px-2 py-1 transition-colors">cancelar</button>
                    <button onClick={handleDeleteAccount} disabled={loading || !currentPassword} className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 px-2 py-1 disabled:opacity-30 transition-colors">{loading ? "..." : "eliminar"}</button>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[var(--color-ink-3)] text-[10px]">|</span>
            <button
              onClick={onLogout}
              className="text-[9px] uppercase tracking-[0.15em] text-[var(--color-fg-4)] hover:text-[var(--color-danger)] transition-colors font-mono"
              title="cerrar sesión"
            >
              salir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  label,
  ok,
  value,
}: {
  label: string;
  ok: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-[var(--color-accent)]" : "bg-[var(--color-fg-4)] pulse-dot"
        }`}
      />
      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] hidden lg:inline">
        {label}
      </span>
      <span className="text-[var(--color-fg-3)] text-[11px]">{value}</span>
    </div>
  );
}
