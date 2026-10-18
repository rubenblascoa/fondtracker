import { useEffect, useRef, useState, type ReactNode } from "react";
import { type Status, type User } from "../../api";
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  BarChart3,
  MessageCircle,
  FileText,
  Shield,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";
import { Logo, Label } from "../ui";

export type DashboardSection = "overview" | "portfolio" | "add" | "analytics" | "notifications" | "reports" | "admin" | "docs";

/** Nombre de cada sección: es a la vez la etiqueta del menú y el título de la pantalla. */
export const SECTION_META: Record<DashboardSection, { label: string; subtitle: string; icon: typeof Wallet; adminOnly?: boolean }> = {
  overview: { label: "Resumen", subtitle: "Cuánto tienes, cuánto has ganado y dónde está tu dinero", icon: LayoutDashboard },
  portfolio: { label: "Mi cartera", subtitle: "Todos tus fondos, uno a uno", icon: Wallet },
  add: { label: "Añadir fondo", subtitle: "Busca por nombre o ISIN y apunta lo que tienes", icon: PlusCircle },
  analytics: { label: "Análisis", subtitle: "Cómo está repartido tu dinero y cuánto mover para reequilibrar", icon: BarChart3 },
  notifications: { label: "WhatsApp", subtitle: "Recibe el resumen de tu cartera en el móvil", icon: MessageCircle },
  reports: { label: "Informes", subtitle: "PDF, Excel, copia de seguridad y simulador de IRPF", icon: FileText },
  admin: { label: "Admin", subtitle: "Usuarios, catálogo, envíos y servidor", icon: Shield, adminOnly: true },
  docs: { label: "API", subtitle: "Endpoints, arquitectura y base de datos", icon: BookOpen, adminOnly: true },
};

const MAIN: DashboardSection[] = ["overview", "portfolio", "add", "analytics", "notifications", "reports"];
const ADMIN: DashboardSection[] = ["admin", "docs"];

type Props = {
  user: User;
  status: Status | null;
  fundCount: number;
  section: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
};

function NavButton({ id, active, badge, onClick }: { id: DashboardSection; active: boolean; badge?: ReactNode; onClick: () => void }) {
  const { label, icon: Icon } = SECTION_META[id];
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all ${
        active
          ? "bg-[var(--color-tag-bg)] text-[var(--color-fg-1)]"
          : "text-[var(--color-fg-3)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]"
      }`}
    >
      <Icon size={17} className={active ? "text-[var(--color-accent)]" : ""} />
      <span className="flex-1 text-left">{label}</span>
      {badge}
    </button>
  );
}

function UserFooter({ user, onOpenSettings, onLogout }: Pick<Props, "user" | "onOpenSettings" | "onLogout">) {
  return (
    <div className="flex items-center gap-3 border-t border-[var(--color-border)] p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-tag-bg)] font-mono text-sm font-semibold text-[var(--color-tag-fg)]">
        {user.username.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-fg-1)]">{user.username}</p>
        <p className="truncate text-xs text-[var(--color-fg-4)]">{user.email}</p>
      </div>
      <button onClick={onOpenSettings} title="Ajustes" className="rounded-xl p-2 text-[var(--color-fg-4)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]">
        <Settings size={16} />
      </button>
      <button onClick={onLogout} title="Cerrar sesión" className="rounded-xl p-2 text-[var(--color-fg-4)] hover:bg-[var(--color-loss)]/10 hover:text-[var(--color-loss)]">
        <LogOut size={16} />
      </button>
    </div>
  );
}

export function DashboardNav(props: Props) {
  const { user, status, fundCount, section, onSelectSection, mobileDrawerOpen, setMobileDrawerOpen } = props;
  const badgeFor = (id: DashboardSection) => {
    if (id === "portfolio" && fundCount > 0)
      return <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-fg-3)]">{fundCount}</span>;
    if (id === "notifications" && status?.whatsapp?.configured)
      return <span className="h-2 w-2 rounded-full bg-[var(--color-profit)]" title="Activo" />;
    return undefined;
  };
  const list = (ids: DashboardSection[], close = false) =>
    ids.map((id) => (
      <NavButton
        key={id}
        id={id}
        active={section === id}
        badge={badgeFor(id)}
        onClick={() => {
          onSelectSection(id);
          if (close) setMobileDrawerOpen(false);
        }}
      />
    ));

  const sidebar = (inDrawer: boolean) => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo href="/" />
        {inDrawer && (
          <button onClick={() => setMobileDrawerOpen(false)} className="rounded-xl p-2 text-[var(--color-fg-4)] hover:text-[var(--color-fg-1)]" aria-label="Cerrar menú">
            <X size={18} />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {list(MAIN, inDrawer)}
        {user.is_admin && (
          <>
            <div className="px-3.5 pb-1 pt-5">
              <Label>Administración</Label>
            </div>
            {list(ADMIN, inDrawer)}
          </>
        )}
      </nav>
      <UserFooter {...props} />
    </div>
  );

  return (
    <>
      {/* Escritorio: barra superior con las secciones en una píldora */}
      <TopBar {...props} badgeFor={badgeFor} />

      {/* Móvil: barra superior */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-ink-0)]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo href="/" size="sm" />
        <button onClick={() => setMobileDrawerOpen(true)} className="rounded-xl border border-[var(--color-border)] p-2 text-[var(--color-fg-2)]" aria-label="Abrir menú">
          <Menu size={18} />
        </button>
      </header>

      {/* Móvil: menú lateral */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="h-full w-72 border-r border-[var(--color-border)] bg-[var(--color-ink-1)] slide-left">{sidebar(true)}</div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* Móvil: barra inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-ink-0)]/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden">
        {(["overview", "portfolio"] as DashboardSection[]).map((id) => {
          const { label, icon: Icon } = SECTION_META[id];
          return (
            <button key={id} onClick={() => onSelectSection(id)} className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] ${section === id ? "text-[var(--color-fg-1)]" : "text-[var(--color-fg-4)]"}`}>
              <Icon size={18} className={section === id ? "text-[var(--color-accent)]" : ""} />
              {label}
            </button>
          );
        })}
        <button onClick={() => onSelectSection("add")} className="-mt-6 flex flex-col items-center" aria-label="Añadir fondo">
          <span className="grid h-12 w-12 place-items-center rounded-full border-4 border-[var(--color-ink-0)] text-[#0b0b0a]" style={{ background: "var(--gradient-accent)" }}>
            <Plus size={22} strokeWidth={2.6} />
          </span>
        </button>
        {(["analytics", "reports"] as DashboardSection[]).map((id) => {
          const { label, icon: Icon } = SECTION_META[id];
          return (
            <button key={id} onClick={() => onSelectSection(id)} className={`flex flex-col items-center gap-1 px-3 py-1 text-[10px] ${section === id ? "text-[var(--color-fg-1)]" : "text-[var(--color-fg-4)]"}`}>
              <Icon size={18} className={section === id ? "text-[var(--color-accent)]" : ""} />
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}

/** Barra superior de escritorio: logo, secciones en píldora, añadir fondo y menú de la cuenta. */
function TopBar(props: Props & { badgeFor: (id: DashboardSection) => ReactNode }) {
  const { user, section, onSelectSection, onOpenSettings, onLogout, badgeFor } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const pill: DashboardSection[] = ["overview", "portfolio", "analytics", "notifications", "reports"];
  const menuItem = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[var(--color-fg-2)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]";

  return (
    <header className="relative z-30 hidden shrink-0 items-center justify-between gap-6 px-8 py-4 lg:flex">
      <Logo href="/" />
      <nav aria-label="Secciones" className="flex items-center gap-1 rounded-full xl:absolute xl:left-1/2 xl:-translate-x-1/2 border border-[var(--color-border)] bg-[var(--color-ink-1)]/70 p-1 backdrop-blur-xl">
        {pill.map((id) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => onSelectSection(id)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors xl:px-4 ${
                active ? "bg-[var(--color-fg-1)] text-[var(--color-ink-0)]" : "text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
              }`}
            >
              {SECTION_META[id].label}
              {!active && badgeFor(id)}
            </button>
          );
        })}
      </nav>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectSection("add")}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--color-btn-bg)] px-4 py-2 text-[13px] font-semibold text-[var(--color-btn-fg)] transition-opacity hover:opacity-85"
        >
          <Plus size={15} strokeWidth={2.4} /> Añadir fondo
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ink-1)]/70 py-1 pl-1 pr-3 text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-tag-bg)] font-mono text-sm font-semibold text-[var(--color-tag-fg)]">
              {(user.display_name || user.username).slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden max-w-[9rem] truncate text-[13px] font-medium xl:inline">{user.display_name || user.username}</span>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink-1)] p-2 shadow-2xl">
              <p className="truncate px-3 pt-1 text-sm font-medium text-[var(--color-fg-1)]">{user.display_name || user.username}</p>
              <p className="truncate px-3 pb-2 text-xs text-[var(--color-fg-4)]">{user.email}</p>
              <button className={menuItem} onClick={() => { setMenuOpen(false); onOpenSettings(); }}>
                <Settings size={15} /> Ajustes
              </button>
              {user.is_admin &&
                ADMIN.map((id) => {
                  const { label, icon: Icon } = SECTION_META[id];
                  return (
                    <button key={id} className={menuItem} onClick={() => { setMenuOpen(false); onSelectSection(id); }}>
                      <Icon size={15} /> {label}
                    </button>
                  );
                })}
              <div className="my-1 border-t border-[var(--color-border)]" />
              <button className={`${menuItem} hover:!text-[var(--color-loss)]`} onClick={onLogout}>
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
