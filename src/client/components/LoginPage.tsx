import { useState } from "react";
import { api, setToken } from "../api";

type Props = {
  onAuth: () => void;
  onSwitchToRegister: () => void;
};

export function LoginPage({ onAuth, onSwitchToRegister }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      setError(err instanceof Error ? err.message : "Login error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[var(--color-accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Main Container */}
      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10 fade-in border border-white/10 bg-black/40 backdrop-blur-2xl">
        
        {/* LEFT COLUMN: Features & Branding */}
        <div className="hidden lg:flex w-full lg:w-[50%] p-8 sm:p-12 relative overflow-hidden flex-col justify-center">
          {/* Subtle Grid Background (Perspective) */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(57,255,136,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,136,0.2) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              transform: 'perspective(500px) rotateX(60deg) scale(2.5) translateY(-50%)'
            }}
          />
          {/* Gradient Overlay for the grid to fade it out nicely */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80 pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-8 h-8 bg-[var(--color-accent)]/20 rounded-lg flex items-center justify-center border border-[var(--color-accent)]/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7"></path>
                  <path d="M7 7h10v10"></path>
                </svg>
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-wide">FondTracker</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              Welcome back
            </h1>
            <p className="text-[var(--color-fg-4)] text-sm mb-12 flex items-center gap-2 font-medium">
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure access to your dashboard
            </p>

            <div className="space-y-8">
              {/* Feature 1 */}
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-[15px]">Track unlimited assets</h3>
                  <p className="text-[var(--color-fg-4)] text-[13px] leading-relaxed">
                    Add and monitor as many investment funds and ETFs as you need without arbitrary restrictions. Build your ultimate dashboard.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-[15px]">Real-time accuracy</h3>
                  <p className="text-[var(--color-fg-4)] text-[13px] leading-relaxed">
                    Prices and NAVs are automatically synced every single day to ensure your portfolio valuation is always up to date.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1 text-[15px]">Built-in privacy</h3>
                  <p className="text-[var(--color-fg-4)] text-[13px] leading-relaxed">
                    Your financial data is yours. We don't sell data to third parties, and our architecture is designed to keep you in control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Form */}
        <div className="w-full lg:w-[50%] p-8 sm:p-12 bg-black/30 border-l border-white/5 flex flex-col justify-center">
          
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-[var(--color-accent)]/20 rounded-lg flex items-center justify-center border border-[var(--color-accent)]/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7"></path>
                <path d="M7 7h10v10"></path>
              </svg>
            </div>
            <span className="font-heading font-bold text-lg text-white tracking-wide">FondTracker</span>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <span className="text-[13px] text-[var(--color-fg-4)] font-medium">Sign in with</span>
            <div className="flex gap-2">
              <a href="/api/auth/google" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-[13px] font-medium text-white">Google</span>
              </a>
              <a href="/api/auth/github" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                <svg width="16" height="16" fill="currentColor" className="text-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.825 1.11.825 2.235 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="text-[13px] font-medium text-white">GitHub</span>
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="block text-[13px] text-[var(--color-fg-1)] font-medium">Email or Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-[var(--color-accent)]/50 focus:bg-black/60 text-[var(--color-fg-1)] text-sm pl-11 pr-3 py-3.5 rounded-lg outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                  placeholder="name@company.com"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[13px] text-[var(--color-fg-1)] font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => alert("Contacta al administrador en rubenblascoarmengod@gmail.com para restablecer tu contraseña.")}
                  className="text-[11px] text-[var(--color-fg-4)] hover:text-[var(--color-accent)] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)]">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 focus:border-[var(--color-accent)]/50 focus:bg-black/60 text-[var(--color-fg-1)] text-sm pl-11 pr-10 py-3.5 rounded-lg outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-4)] hover:text-white transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[var(--color-danger)] text-xs font-mono bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-3 py-2 rounded-md">
                <span className="shrink-0">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className="w-full bg-[var(--color-accent)] text-[#0a0a0a] font-semibold text-sm py-4 rounded-lg hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
             <span className="text-[13px] text-[var(--color-fg-4)]">Don't have an account?</span>
             <button
               onClick={onSwitchToRegister}
               className="text-[13px] text-white font-medium hover:text-[var(--color-accent)] transition-colors"
             >
               Register for free &rarr;
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}
