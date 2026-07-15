import { useCallback, useEffect, useState } from "react";
import { api, clearToken, getToken, type Investment, type Status, type User } from "./api";
import { AddFundForm } from "./components/AddFundForm";
import { FundCard } from "./components/FundCard";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { NotifyPanel } from "./components/NotifyPanel";
import { RegisterPage } from "./components/RegisterPage";
import { Stats } from "./components/Stats";
import { ApiDocsModal } from "./components/ApiDocsModal";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);
  const [funds, setFunds] = useState<Investment[]>([]);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);

  const isLoginPath = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register");

  useEffect(() => {
    if (isLoginPath) {
      clearToken();
      setChecking(false);
      return;
    }
    if (!getToken()) {
      window.location.replace("/login");
      return;
    }
    api
      .me()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        clearToken();
        window.location.replace("/login");
      })
      .finally(() => {
        setChecking(false);
      });
  }, [isLoginPath]);

  const refresh = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([api.status(), api.listFunds()]);
      setStatus(s);
      setFunds(f);
    } catch {
      // token expired or server error — don't crash
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void refresh();
    const t = setInterval(refresh, 10_000);
    return () => clearInterval(t);
  }, [user, refresh]);

  function handleLogout() {
    clearToken();
    window.location.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="scanline" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-pulse" />
          <span className="font-pixel text-xs text-[var(--color-fg-4)] tracking-widest uppercase">
            cargando
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === "register") {
      return (
        <RegisterPage
          onAuth={() => {
            if (isLoginPath) { window.location.replace("/dashboard"); return; }
            api.me().then(setUser).catch(() => {});
          }}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <LoginPage
        onAuth={() => {
          if (isLoginPath) { window.location.replace("/dashboard"); return; }
          api.me().then(setUser).catch(() => {});
        }}
        onSwitchToRegister={() => setAuthView("register")}
      />
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="scanline" />
      <Header status={status} user={user} onLogout={handleLogout} />
      <ApiDocsModal isOpen={apiDocsOpen} onClose={() => setApiDocsOpen(false)} />

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <Stats status={status} />

        <section className="mb-12">
          <SectionTitle index="01" title="añadir inversión" />
          <AddFundForm onAdded={refresh} />
        </section>

        <section className="mb-12">
          <SectionTitle index="02" title="mis inversiones" />
          {funds.length === 0 ? (
            <div className="border border-dashed border-[var(--color-ink-3)] p-10 text-center text-sm text-[var(--color-fg-3)]">
              <div className="font-pixel text-3xl text-[var(--color-fg-4)] mb-3">∅</div>
              <p className="max-w-sm mx-auto leading-relaxed">
                tu cartera está vacía. busca un fondo en el catálogo y registra tu primera inversión.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {funds.map((fund) => (
                <FundCard key={fund.id} fund={fund} onChange={refresh} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-12">
          <SectionTitle index="03" title="notificaciones" />
          <NotifyPanel status={status} onChange={refresh} />
        </section>

        <footer className="mt-20 pt-8 border-t border-[var(--color-ink-3)] text-[10px] uppercase tracking-[0.25em] text-[var(--color-fg-4)] flex items-center justify-between">
          <span>fondtracker · v1.0</span>
          <span>datos de mercado vía Yahoo Finance</span>
        </footer>
      </main>
    </div>
  );
}

function SectionTitle({ index, title }: { index: string; title: string }) {
  return (
    <h2 className="flex items-center gap-3 mb-4">
      <span className="font-pixel text-xs text-[var(--color-accent)]">
        {index}
      </span>
      <span className="font-pixel uppercase text-sm text-[var(--color-fg-1)] tracking-wider">
        {title}
      </span>
      <span className="flex-1 h-px bg-[var(--color-ink-3)]" />
    </h2>
  );
}
