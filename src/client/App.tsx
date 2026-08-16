import { useCallback, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken, onAuthChange, type Investment, type Status, type User } from "./api";
import { AddFundForm } from "./components/AddFundForm";
import { FundCard } from "./components/FundCard";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { NotifyPanel } from "./components/NotifyPanel";
import { RegisterPage } from "./components/RegisterPage";
import { LandingPage } from "./components/LandingPage";
import { Stats } from "./components/Stats";
import { LegalPage } from "./components/LegalPage";
import { Footer } from "./components/Footer";
import { AdminPanel } from "./components/AdminPanel";
import { UserDashboard } from "./components/UserDashboard";
import { applyTheme, getStoredTheme } from "./theme";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[var(--color-ink-0)]" style={{ zIndex: 0 }}>
      {/* Grid Pattern with fading edges */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ 
          backgroundImage: 'linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)', 
          WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' 
        }}
      />
      
      {/* Floating Orbs */}
      <div 
        className="absolute animate-float-1 rounded-full" 
        style={{ top: '10%', right: '10%', width: '40vw', height: '40vw', maxWidth: '500px', maxHeight: '500px', backgroundColor: 'var(--color-accent)', opacity: 0.12, filter: 'blur(120px)' }} 
      />
      <div 
        className="absolute animate-float-3 rounded-full" 
        style={{ bottom: '5%', left: '5%', width: '50vw', height: '50vw', maxWidth: '600px', maxHeight: '600px', backgroundColor: 'var(--color-accent)', opacity: 0.08, filter: 'blur(150px)' }} 
      />
    </div>
  );
}



export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">(
    window.location.pathname.startsWith("/register") ? "register" : "login"
  );
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [funds, setFunds] = useState<Investment[]>([]);

  const isLoginPath = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register");
  const isPrivacyPath = window.location.pathname.startsWith("/legal/privacy-policy") || window.location.pathname.startsWith("/legal/privacy");
  const isTermsPath = window.location.pathname.startsWith("/legal/terms-of-service") || window.location.pathname.startsWith("/legal/terms");
  const isRootPath = window.location.pathname === "/";
  const isAdminPath = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    api.getBanks().catch(() => {});
  }, []);

  useEffect(() => {
    let title = "FondTracker";
    if (isLoginPath) {
      title = authView === "register" ? "FondTracker | Register" : "FondTracker | Login";
    } else if (isPrivacyPath || isTermsPath) {
      title = "FondTracker | Legal";
    } else if (isAdminPath) {
      title = "FondTracker | Admin";
    } else {
      title = "FondTracker | Dashboard";
    }
    document.title = title;
  }, [isLoginPath, isPrivacyPath, isTermsPath, isAdminPath, authView]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith("/register")) {
        setAuthView("register");
      } else if (window.location.pathname.startsWith("/login")) {
        setAuthView("login");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    // Only accept tokens from hash fragment (#token=...) — never logged by servers
    const hash = window.location.hash;
    const fragmentToken = hash.startsWith("#token=") ? hash.slice(7) : null;

    if (fragmentToken) {
      setToken(fragmentToken);
      window.location.replace("/dashboard");
      return;
    }

    if (!getToken()) {
      if (isRootPath || isLoginPath || isPrivacyPath || isTermsPath || isAdminPath) {
        setChecking(false);
        return;
      }
      window.location.replace("/login");
      return;
    }
    api
      .me()
      .then((u) => {
        setUser(u);
        if (isLoginPath) {
          window.history.replaceState({}, "", "/dashboard");
        }
      })
      .catch(() => {
        clearToken();
        if (isRootPath || isLoginPath || isPrivacyPath || isTermsPath || isAdminPath) return;
        window.location.replace("/login");
      })
      .finally(() => {
        setChecking(false);
      });
  }, [isLoginPath, isPrivacyPath, isTermsPath, isAdminPath]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const { funds, status } = await api.portfolio();
      if (signal?.aborted) return;
      setStatus(status);
      setFunds(funds);
    } catch {
      // token expired or server error — don't crash
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (getToken()) {
        const me = await api.me();
        setUser(me);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Cross-tab / cross-window auth sync via BroadcastChannel
    const unsubscribe = onAuthChange((type, token) => {
      if (type === "login") {
        if (token) setToken(token); // store in THIS tab's sessionStorage
        refreshUser();
      } else {
        setUser(null);
        if (!isRootPath && !isPrivacyPath && !isTermsPath) {
          window.location.replace("/login");
        }
      }
    });

    // Fallback: re-check when user returns to this tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (getToken()) {
          refreshUser();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshUser, isRootPath, isPrivacyPath, isTermsPath]);

  useEffect(() => {
    if (!user) return;
    const ctrl = new AbortController();

    // Fetch WhatsApp config instantly
    api.getWhatsAppConfig()
      .then((waConfig) => {
        if (ctrl.signal.aborted) return;
        setStatus(prev => {
          if (!prev) {
            return {
              total_initial: 0,
              total_current: 0,
              total_profit_loss: 0,
              total_profit_loss_pct: 0,
              fund_count: 0,
              platform: "",
              whatsapp: waConfig
            };
          }
          return {
            ...prev,
            whatsapp: waConfig
          };
        });
      })
      .catch(() => {});

    void refresh(ctrl.signal);
    // 30s is enough — prices are cached 5 min server-side
    const t = setInterval(() => void refresh(ctrl.signal), 30_000);
    return () => { ctrl.abort(); clearInterval(t); };
  }, [user, refresh]);

  // Synchronize theme: Only user dashboard uses the saved custom theme (Light/Dark).
  // Landing page, Login, Register, and Legal views are always forced to the dark theme.
  useEffect(() => {
    const isDashboardView = !isRootPath && !isPrivacyPath && !isTermsPath && (user !== null || isAdminPath);
    if (isDashboardView) {
      applyTheme(getStoredTheme(), false);
    } else {
      applyTheme("dark", false);
    }
  }, [isRootPath, isPrivacyPath, isTermsPath, isAdminPath, user]);

  function handleLogout() {
    clearToken();
    window.location.replace("/login");
  }

  function handleSwitchToRegister() {
    window.history.pushState({}, "", "/register");
    setAuthView("register");
  }

  function handleSwitchToLogin() {
    window.history.pushState({}, "", "/login");
    setAuthView("login");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-pulse" />
          <span className="font-pixel text-xs text-[var(--color-fg-4)] tracking-widest uppercase">
            cargando
          </span>
        </div>
      </div>
    );
  }

  if (isPrivacyPath) {
    return (
      <div className="min-h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans relative">
        <AnimatedBackground />
        <LegalPage view="privacy" user={user} onLogout={handleLogout} />
      </div>
    );
  }

  if (isTermsPath) {
    return (
      <div className="min-h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans relative">
        <AnimatedBackground />
        <LegalPage view="terms" user={user} onLogout={handleLogout} />
      </div>
    );
  }


  if (isAdminPath) {
    if (!user) {
      window.location.replace("/login");
      return null;
    }
    if (!user.is_admin) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080810", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "32px" }}>🚫</div>
          <div style={{ color: "#ff6464", fontFamily: "monospace", fontSize: "14px" }}>Acceso denegado — no eres administrador</div>
          <a href="/dashboard" style={{ color: "#39ff88", fontSize: "13px" }}>← Volver al dashboard</a>
        </div>
      );
    }
    return (
      <UserDashboard
        user={user}
        status={status}
        funds={funds}
        onRefresh={refresh}
        onLogout={handleLogout}
        initialSection="admin"
      />
    );
  }

  if (isRootPath) {
    return <LandingPage user={user} onLogout={handleLogout} />;
  }

  if (!user) {
    if (authView === "register") {
      return (
        <div className="flex flex-col min-h-screen bg-[var(--color-ink-0)] relative">
          <AnimatedBackground />
          <Header />
          <RegisterPage
            onAuth={() => {
              window.location.replace("/dashboard");
            }}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-ink-0)] relative">
        <AnimatedBackground />
        <Header />
        <LoginPage
          onAuth={() => {
            window.location.replace("/dashboard");
          }}
          onSwitchToRegister={handleSwitchToRegister}
        />
      </div>
    );
  }

  return (
    <UserDashboard
      user={user}
      status={status}
      funds={funds}
      onRefresh={refresh}
      onLogout={handleLogout}
    />
  );
}
