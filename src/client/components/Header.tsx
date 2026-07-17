import { useState, useRef, useEffect } from "react";
import type { Status, User } from "../api";
import { api, clearToken } from "../api";
import { COUNTRIES } from "./RegisterPage";

type Props = {
  status?: Status | null;
  user?: User | null;
  onLogout?: () => void;
  onOpenApiDocs?: () => void;
  landingNav?: boolean;
};

export function Header({ status, user, onLogout, onOpenApiDocs, landingNav }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<"menu" | "email" | "password" | "delete" | "phone" | null>(null);
  const [phoneCountry, setPhoneCountry] = useState(() => COUNTRIES.find(c => c.code === "ES") ?? COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
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

  function openView(v: "email" | "password" | "delete" | "phone") {
    setView(v);
    setError("");
    setEmail("");
    setCurrentEmail("");
    setCurrentPassword("");
    setNewPassword("");
    if (v === "phone") {
      if (user?.phone) {
        const matchingCountry = COUNTRIES.slice().sort((a,b) => b.dial.length - a.dial.length).find(c => user.phone!.startsWith(c.dial));
        if (matchingCountry) {
          setPhoneCountry(matchingCountry);
          setLocalNumber(user.phone.slice(matchingCountry.dial.length));
        } else {
          setLocalNumber(user.phone);
        }
      } else {
        setLocalNumber("");
      }
    }
  }

  async function handleChangeEmail() {
    setError("");
    if (!currentEmail.includes("@")) { setError("Invalid current email"); return; }
    if (!email.includes("@")) { setError("Invalid new email"); return; }
    setLoading(true);
    try {
      await api.updateAccount({ currentEmail: currentEmail.trim(), email: email.trim() });
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

  async function handleSavePhone() {
    setError("");
    const num = localNumber.replace(/\D/g, "");
    const full = num ? `${phoneCountry.dial}${num}` : "";
    if (num && !/^\+[1-9]\d{6,14}$/.test(full.replace(/[\s-]/g, ""))) {
      setError("Invalid phone number. Format: +34123456789");
      return;
    }
    setLoading(true);
    try {
      await api.updateAccount({ phone: full || null } as any);
      if (user) {
        user.phone = full || null;
      }
      setView(null);
      setMenuOpen(false);
      window.location.reload();
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

                  <button onClick={() => openView("phone")} className="w-full flex items-center gap-3 px-3 py-2 text-[12px] font-medium text-[var(--color-fg-2)] hover:bg-white/10 hover:text-white rounded-xl transition-all">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                    Phone Number
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
                  
                  <div className="space-y-2 mb-3">
                    <input type="email" value={currentEmail} onChange={(e) => setCurrentEmail(e.target.value)} placeholder="Current email address" className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all placeholder:text-[var(--color-fg-5)]" autoFocus />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="New email address" className="w-full bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all placeholder:text-[var(--color-fg-5)]" />
                  </div>
                  
                  {error && <p className="text-[11px] text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-2 py-1.5 rounded-lg mb-3 flex items-center gap-2"><span className="font-bold">!</span>{error}</p>}
                  
                  <button onClick={handleChangeEmail} disabled={loading || !currentEmail || !email} className="w-full bg-[var(--color-accent)] text-[#0a0a0a] font-semibold text-[12px] py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)]">
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

              {menuOpen && view === "phone" && (
                <div className="absolute right-0 top-full mt-3 w-72 border border-white/10 bg-black/70 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 p-5 fade-in" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => { setView(null); setError(""); }} className="text-[var(--color-fg-4)] hover:text-white transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h3 className="text-[13px] font-semibold text-white">Phone Number</h3>
                  </div>
                  
                  <div className="flex gap-2 mb-4 relative" ref={countryRef}>
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => { setShowCountryPicker(!showCountryPicker); setCountrySearch(""); }}
                        className="flex items-center gap-1.5 bg-black/40 border border-white/10 hover:border-white/20 text-white text-xs px-2.5 py-2.5 rounded-xl outline-none transition-all min-w-[76px]"
                      >
                        <span className="text-sm leading-none">{phoneCountry.flag}</span>
                        <span className="font-mono text-[10px]">{phoneCountry.dial}</span>
                        <svg className={`w-2.5 h-2.5 text-[var(--color-fg-4)] transition-transform ${showCountryPicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showCountryPicker && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowCountryPicker(false)} />
                          <div className="absolute top-full left-0 mt-2 z-50 w-60 bg-[#0d0d0f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                            <div className="p-2 border-b border-white/5">
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-[var(--color-fg-5)] outline-none focus:border-[var(--color-accent)]/50"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto font-sans">
                              {COUNTRIES.filter(c =>
                                !countrySearch ||
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.dial.includes(countrySearch) ||
                                c.code.toLowerCase().includes(countrySearch.toLowerCase())
                              ).map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => { setPhoneCountry(c); setShowCountryPicker(false); }}
                                  className={`flex items-center gap-2 w-full px-2 py-1.5 text-left text-xs transition-colors hover:bg-white/5 ${phoneCountry.code === c.code ? "bg-white/5 text-white" : "text-[var(--color-fg-2)]"}`}
                                >
                                  <span>{c.flag}</span>
                                  <span className="font-mono text-[10px] text-[var(--color-fg-4)] w-10">{c.dial}</span>
                                  <span className="truncate flex-1 text-left">{c.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={localNumber}
                      onChange={(e) => setLocalNumber(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-black/40 border border-white/10 focus:border-[var(--color-accent)] px-3 py-2.5 rounded-xl text-[13px] text-white outline-none transition-all placeholder:text-[var(--color-fg-5)]"
                      placeholder="612345678"
                    />
                  </div>

                  {error && <p className="text-[11px] text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 px-2 py-1.5 rounded-lg mb-3 flex items-center gap-2"><span className="font-bold">!</span>{error}</p>}
                  
                  <button onClick={handleSavePhone} disabled={loading} className="w-full bg-[var(--color-accent)] text-[#0a0a0a] font-semibold text-[12px] py-2.5 rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(57,255,136,0.2)]">
                    {loading ? "Saving..." : "Save Phone"}
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
