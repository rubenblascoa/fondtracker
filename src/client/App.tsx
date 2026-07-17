import { useCallback, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken, type Investment, type Status, type User } from "./api";
import { AddFundForm } from "./components/AddFundForm";
import { FundCard } from "./components/FundCard";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { NotifyPanel } from "./components/NotifyPanel";
import { RegisterPage } from "./components/RegisterPage";
import { LandingPage } from "./components/LandingPage";
import { Stats } from "./components/Stats";
import { ApiDocsModal } from "./components/ApiDocsModal";
import { LegalPage } from "./components/LegalPage";
import { Footer } from "./components/Footer";

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[var(--color-ink-0)]" style={{ zIndex: 0 }}>
      {/* Grid Pattern with fading edges */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
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

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-pixel text-xs text-[var(--color-fg-4)] tracking-widest uppercase mb-4">{title}</h2>;
}

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">(
    window.location.pathname.startsWith("/register") ? "register" : "login"
  );
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [funds, setFunds] = useState<Investment[]>([]);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);

  const isLoginPath = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register");
  const isPrivacyPath = window.location.pathname.startsWith("/legal/privacy-policy");
  const isTermsPath = window.location.pathname.startsWith("/legal/terms-of-service");
  const isRootPath = window.location.pathname === "/";

  useEffect(() => {
    let title = "FondTracker";
    if (isLoginPath) {
      title = authView === "register" ? "FondTracker | Register" : "FondTracker | Login";
    } else if (isPrivacyPath || isTermsPath) {
      title = "FondTracker | Legal";
    } else {
      title = "FondTracker | Dashboard";
    }
    document.title = title;
  }, [isLoginPath, isPrivacyPath, isTermsPath, authView]);

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

    if (isPrivacyPath || isTermsPath) {
      clearToken();
      setChecking(false);
      return;
    }
    if (!getToken()) {
      if (isRootPath || isLoginPath) {
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
        if (isRootPath || isLoginPath) return;
        window.location.replace("/login");
      })
      .finally(() => {
        setChecking(false);
      });
  }, [isLoginPath, isPrivacyPath, isTermsPath]);

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

  useEffect(() => {
    if (!user) return;
    const ctrl = new AbortController();
    void refresh(ctrl.signal);
    // 30s is enough — prices are cached 5 min server-side
    const t = setInterval(() => void refresh(ctrl.signal), 30_000);
    return () => { ctrl.abort(); clearInterval(t); };
  }, [user, refresh]);

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

  if (isPrivacyPath) {
    return (
      <div className="min-h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans relative">
        <AnimatedBackground />
        <LegalPage view="privacy" />
      </div>
    );
  }

  if (isTermsPath) {
    return (
      <div className="min-h-screen bg-[var(--color-ink-0)] text-[var(--color-fg-1)] font-sans relative">
        <AnimatedBackground />
        <LegalPage view="terms" />
      </div>
    );
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
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Header status={status} user={user} onLogout={handleLogout} />
      <ApiDocsModal isOpen={apiDocsOpen} onClose={() => setApiDocsOpen(false)} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 relative z-10">
        <Stats status={status} />

        <section className="mb-12">
          <SectionTitle title="Add Investment" />
          <AddFundForm onAdded={refresh} />
        </section>

        <section className="mb-12">
          <SectionTitle title="My Investments" />
          {funds.length === 0 ? (
            <div className="border border-dashed border-[var(--color-ink-3)] p-10 text-center text-sm text-[var(--color-fg-3)]">
              <div className="font-pixel text-3xl text-[var(--color-fg-4)] mb-3">∅</div>
              <p className="max-w-sm mx-auto leading-relaxed">
                your portfolio is empty. search for a fund in the catalog and add your first investment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {funds.map((fund) => (
                <FundCard key={fund.id} fund={fund} onChange={refresh} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-12">
          <SectionTitle title="Notifications" />
          <NotifyPanel status={status} onChange={refresh} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SectionTitle({ title, button }: { title: string; button?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
      <h2 className="font-heading font-semibold text-2xl text-[var(--color-fg-1)] flex items-center gap-3">
        {title}
      </h2>
      {button}
    </div>
  );
}
