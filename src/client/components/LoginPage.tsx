import { useState } from "react";
import { api, setToken } from "../api";

type Props = {
  onAuth: () => void;
  onSwitchToRegister: () => void;
};

export function LoginPage({ onAuth, onSwitchToRegister }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login({ identifier, password });
      setToken(result.token);
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
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
            entrar
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] mb-1.5 group-focus-within:text-[var(--color-accent)] transition-colors">
                usuario o email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-5)] group-focus-within:text-[var(--color-accent)] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[var(--color-ink-2)] border border-[var(--color-ink-3)] text-[var(--color-fg-1)] text-sm pl-9 pr-3 py-2.5 focus:outline-none focus:border-[var(--color-accent)] transition-colors font-mono"
                  placeholder="tucorreo@ejemplo.com"
                  autoFocus
                  autoComplete="username"
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
                  placeholder="••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-danger)] text-xs font-mono bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 px-3 py-2 animate-in">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full bg-[var(--color-accent)] text-[var(--color-ink-0)] font-pixel text-[11px] uppercase tracking-widest py-3 border border-[var(--color-accent)]/50 shadow-[0_0_6px_var(--color-accent)] hover:brightness-75 active:brightness-50 disabled:shadow-none disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-1 h-1 bg-[var(--color-ink-0)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-[var(--color-ink-0)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-[var(--color-ink-0)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              ) : (
                "entrar"
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[var(--color-ink-3)] text-center">
            <button
              onClick={onSwitchToRegister}
              className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors"
            >
              no tengo cuenta · crear una
            </button>
          </div>
        </div>

        <p className="text-center text-[9px] text-[var(--color-fg-4)] mt-6 tracking-wide">
          fondtracker funciona 100% local · tus datos no salen de tu máquina
        </p>
      </div>
    </div>
  );
}
