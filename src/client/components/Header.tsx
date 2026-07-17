import { useState, useRef, useEffect } from "react";
import type { Status, User } from "../api";
import { api, clearToken } from "../api";

type Props = {
  status?: Status | null;
  user?: User | null;
  onLogout?: () => void;
  onOpenApiDocs?: () => void;
  landingNav?: boolean;
};

export function Header({ status, user, onLogout, onOpenApiDocs, landingNav }: Props) {
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
    if (!email.includes("@")) { setError("Invalid email"); return; }
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
    if (!currentPassword || !newPassword) { setError("Fill in both fields"); return; }
    if (newPassword.length < 8) { setError("New password must be at least 8 characters long"); return; }
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
    if (!currentPassword) { setError("Enter your password"); return; }
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
    <header className="sticky top-0 z-20 bg-black/10 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_15px_rgba(57,255,136,0.15)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </div>
          <div>
            <a href="/" className="font-heading font-bold text-xl text-[var(--color-fg-1)] tracking-tight hover:text-[var(--color-accent)] transition-colors">
              FONDTRACKER
            </a>
            {user && (
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-fg-4)] font-mono">
                {status?.fund_count ?? 0} {(status?.fund_count ?? 0) === 1 ? "fund" : "funds"}
              </p>
            )}
          </div>
        </div>

        {landingNav && (
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="text-sm font-medium text-[var(--color-fg-3)] hover:text-[var(--color-accent)] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-[var(--color-fg-3)] hover:text-[var(--color-accent)] transition-colors">How it Works</a>
            <a href="#tech-stack" className="text-sm font-medium text-[var(--color-fg-3)] hover:text-[var(--color-accent)] transition-colors">Technology</a>
          </div>
        )}

        {user ? (
          <div className="ml-auto flex items-center gap-4 sm:gap-6 text-xs text-[var(--color-fg-3)]">
            {landingNav && (
              <a href="/dashboard" className="px-4 py-2 bg-[var(--color-ink-2)] text-white hover:text-[var(--color-accent)] font-semibold rounded-lg border border-[var(--color-ink-3)] transition-colors hidden md:block">
                Go to Dashboard
              </a>
            )}
            <StatusPill
              label="WhatsApp"
              ok={Boolean(status?.whatsapp.configured)}
            />
            <div className="relative flex items-center border-l border-[var(--color-ink-3)] pl-4 sm:pl-6" ref={menuRef}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-md flex items-center justify-center text-[12px] text-[var(--color-accent)] font-pixel shadow-[0_0_10px_rgba(57,255,136,0.1)]">
                  {user.username[0].toUpperCase()}
                </div>
                <span className="text-[12px] font-medium text-[var(--color-fg-1)] hidden sm:block leading-none ml-1 translate-y-[1px]">
                  {user.username}
                </span>
                
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="ml-1 p-1 text-[var(--color-fg-4)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-md transition-all flex items-center justify-center translate-y-[1px]"
                  title="Settings"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>
              </div>

              {menuOpen && !view && (
                <div className="absolute right-0 top-full mt-3 w-56 border border-white/10 bg-black/70 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 p-2 fade-in" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  
                  <div className="px-3 py-3 border-b border-white/5 mb-2">
                    <p className="text-[10px] text-[var(--color-fg-4)] font-mono uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-[13px] font-medium text-white truncate">{user.email || user.username}</p>
                  </div>

                  <button onClick={() => openView("email")} className="w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--color-fg-2)] hover:bg-white/10 hover:text-white rounded-xl transition-all">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    Change Email
                  </button>
                  
                  <button onClick={() => openView("password")} className="w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--color-fg-2)] hover:bg-white/10 hover:text-white rounded-xl transition-all">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Change Password
                  </button>
                  
                  <div className="h-px bg-white/5 my-2 mx-2" />
                  
                  <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--color-fg-2)] hover:bg-white/10 hover:text-[var(--color-danger)] rounded-xl transition-all">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Sign Out
                  </button>
                  
                  <button onClick={() => openView("delete")} className="w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-xl transition-all">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Delete Account
                  </button>
                </div>
              )}

              {menuOpen && view === "email" && (
                <div className="absolute right-0 top-full mt-3 w-72 border border-white/10 bg-black/70 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 p-5 fade-in" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[var(--color-fg-4)] hover:text-white transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h3 className="text-[13px] font-semibold text-white">Change Email</h3>
                  </div>
                  
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="New email address" className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all mb-3 placeholder:text-[var(--color-fg-5)]" autoFocus />
                  
                  {error && <p className="text-[11px] text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-2 py-1.5 rounded-lg mb-3 flex items-center gap-2"><span className="font-bold">!</span>{error}</p>}
                  
                  <button onClick={handleChangeEmail} disabled={loading || !email} className="w-full bg-[var(--color-accent)] text-[#0a0a0a] font-semibold text-[12px] py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)]">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}

              {menuOpen && view === "password" && (
                <div className="absolute right-0 top-full mt-3 w-72 border border-white/10 bg-black/70 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 p-5 fade-in" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[var(--color-fg-4)] hover:text-white transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h3 className="text-[13px] font-semibold text-white">Change Password</h3>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all placeholder:text-[var(--color-fg-5)]" autoFocus />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min. 8)" className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all placeholder:text-[var(--color-fg-5)]" />
                  </div>

                  {error && <p className="text-[11px] text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-2 py-1.5 rounded-lg mb-3 flex items-center gap-2"><span className="font-bold">!</span>{error}</p>}
                  
                  <button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword} className="w-full bg-[var(--color-accent)] text-[#0a0a0a] font-semibold text-[12px] py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)]">
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}

              {menuOpen && view === "delete" && (
                <div className="absolute right-0 top-full mt-3 w-72 border border-white/10 bg-black/70 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 p-5 fade-in" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="flex items-center gap-3 mb-3">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[var(--color-fg-4)] hover:text-white transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h3 className="text-[13px] font-semibold text-[var(--color-danger)]">Delete Account</h3>
                  </div>
                  
                  <p className="text-[11px] text-[var(--color-fg-3)] leading-relaxed mb-4 bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/10 p-3 rounded-xl">
                    This action is <strong className="text-[var(--color-danger)]">irreversible</strong>. All your portfolio data, history, and settings will be permanently deleted.
                  </p>
                  
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Confirm your password" className="w-full bg-black/40 border border-[var(--color-danger)]/30 focus:border-[var(--color-danger)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all mb-4 placeholder:text-[var(--color-danger)]/50" autoFocus />
                  
                  {error && <p className="text-[11px] text-[var(--color-danger)] mb-3 flex items-center gap-2"><span className="font-bold">!</span>{error}</p>}
                  
                  <button onClick={handleDeleteAccount} disabled={loading || !currentPassword} className="w-full bg-[var(--color-danger)] text-white font-semibold text-[12px] py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,90,74,0.2)]">
                    {loading ? "Deleting..." : "Permanently Delete"}
                  </button>
                </div>
              )}
            </div>
        </div>
        ) : landingNav ? (
          <div className="ml-auto hidden md:flex items-center gap-4">
            <a href="/login" className="text-sm font-semibold text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)] transition-colors">Log in</a>
            <a href="/register" className="px-5 py-2.5 bg-[var(--color-accent)] text-black font-semibold text-sm rounded-lg shadow-[0_0_15px_rgba(57,255,136,0.2)] hover:shadow-[0_0_25px_rgba(57,255,136,0.4)] transition-all">
              Get Started
            </a>
          </div>
        ) : (
          <div className="ml-auto flex items-center">
            <a href="/" className="font-pixel uppercase text-[10px] tracking-widest px-4 py-2 border border-[var(--color-ink-3)] text-[var(--color-fg-3)] hover:border-[var(--color-fg-1)] hover:text-[var(--color-fg-1)] transition-colors inline-block text-center">
              ← return to app
            </a>
          </div>
        )}
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
  value?: string;
}) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span
        className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
          ok ? "bg-[var(--color-accent)] text-[var(--color-accent)]" : "bg-[var(--color-danger)] text-[var(--color-danger)] pulse-dot"
        }`}
      />
      <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-4)] hidden lg:inline">
        {label}
      </span>
      {value && <span className="text-[var(--color-fg-3)] text-[11px]">{value}</span>}
    </div>
  );
}
