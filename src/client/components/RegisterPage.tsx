import { useState } from "react";
import { api, setToken } from "../api";

type Props = {
  onAuth: () => void;
  onSwitchToLogin: () => void;
};

export function RegisterPage({ onAuth, onSwitchToLogin }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("El usuario necesita al menos 3 caracteres");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Solo letras, números y guión bajo en el usuario");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Introduce un email válido");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña necesita al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const result = await api.register({ username, email, password });
      setToken(result.token);
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="scanline" />
      <div className="w-full max-w-sm relative z-10 fade-in">
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <svg
              width="40"
              height="40"
              viewBox="0 0 32 32"
              shapeRendering="crispEdges"
              className="text-[var(--color-accent)]"
            >
              <rect x="6" y="20" width="4" height="6" fill="currentColor" />
              <rect x="12" y="14" width="4" height="12" fill="currentColor" />
              <rect x="18" y="8" width="4" height="18" fill="currentColor" />
              <rect x="24" y="4" width="4" height="22" fill="currentColor" />
              <rect x="4" y="28" width="26" height="2" fill="currentColor" />
            </svg>
          </div>
          <h1 className="font-pixel text-3xl text-[var(--color-fg-1)] glow mb-1">
            FONDTRACKER
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-fg-4)]">
            tu cartera, bajo control
          </p>
        </div>

        <div className="border border-[var(--color-ink-3)] bg-[var(--color-ink-1)]/80 p-6 slide-up">
          <h2 className="font-pixel text-[11px] text-[var(--color-accent)] uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-1 h-1 bg-[var(--color-accent)] rounded-full" />
            crear cuenta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5 group-focus-within:text-[var(--color-accent)] transition-colors">
                usuario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-5)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] text-[var(--color-fg-1)] text-sm pl-9 pr-3 py-2.5 focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                  placeholder="username"
                  autoFocus
                  autoComplete="username"
                />
              </div>
              {username.length > 0 && username.length < 3 && (
                <p className="text-[11px] text-[var(--color-warn)] mt-1.5 font-mono text-left tracking-wide">mínimo 3 caracteres</p>
              )}
            </div>

            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5 group-focus-within:text-[var(--color-accent)] transition-colors">
                email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-5)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] text-[var(--color-fg-1)] text-sm pl-9 pr-3 py-2.5 focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5 group-focus-within:text-[var(--color-accent)] transition-colors">
                contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-5)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] text-[var(--color-fg-1)] text-sm pl-9 pr-3 py-2.5 focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                  placeholder=""
                  autoComplete="new-password"
                />
              </div>
              <div className="mt-3 ml-3 flex flex-col items-start gap-0.5">
                {[
                  { test: password.length >= 6, label: "Mínimo 6 caracteres" },
                  { test: /[A-Z]/.test(password), label: "Una mayúscula" },
                  { test: /[a-z]/.test(password), label: "Una minúscula" },
                  { test: /[0-9]/.test(password), label: "Un número" },
                  { test: /[^a-zA-Z0-9]/.test(password), label: "Un símbolo" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center gap-2 text-[11px] font-mono tracking-wide">
                    <span className={`w-3 text-xs text-center transition-colors ${r.test ? "text-[var(--color-accent)]" : "text-[var(--color-fg-5)]"}`}>✓</span>
                    <span className={`transition-colors ${r.test ? "text-[var(--color-accent)]" : "text-[var(--color-fg-5)]"}`}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5 group-focus-within:text-[var(--color-accent)] transition-colors">
                repetir contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-5)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`w-full bg-[var(--color-ink-2)] border text-[var(--color-fg-1)] text-sm pl-9 pr-3 py-2.5 focus:outline-none transition-colors font-mono ${
                    confirm.length > 0 && confirm !== password
                      ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
                      : "border-[var(--color-ink-3)] focus:border-[var(--color-accent)]"
                  }`}
                  placeholder=""
                  autoComplete="new-password"
                />
              </div>
              {confirm.length > 0 && confirm !== password && (
                <p className="text-[11px] text-[var(--color-danger)] mt-2 ml-3 font-mono text-left tracking-wide flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Las contraseñas no coinciden</span>
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-danger)] text-xs font-mono bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 px-3 py-2 animate-in">
                <span className="shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !email || !password || !confirm}
              className="w-full bg-[var(--color-accent)] text-[var(--color-ink-0)] font-pixel text-[11px] uppercase tracking-widest py-3 border border-[var(--color-accent)]/50 shadow-[0_0_6px_var(--color-accent)] hover:brightness-75 active:brightness-50 disabled:shadow-none disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-[var(--color-ink-0)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-[var(--color-ink-0)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-[var(--color-ink-0)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              ) : (
                "crear cuenta"
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[var(--color-ink-3)] text-center">
            <button
              onClick={onSwitchToLogin}
              className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors"
            >
              ya tengo cuenta · entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
