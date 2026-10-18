// Primitivas visuales de FondTracker 2.0 ("Mezcla 2"). Todas pintan con tokens de styles.css.
import type { ButtonHTMLAttributes, ElementType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
        variant === "primary" && "bg-[var(--color-btn-bg)] text-[var(--color-btn-fg)] hover:opacity-90",
        variant === "ghost" && "border border-[var(--color-border)] text-[var(--color-fg-2)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg-1)]",
        variant === "danger" && "border border-[var(--color-loss)]/30 text-[var(--color-loss)] hover:bg-[var(--color-loss)]/10",
        className,
      )}
    />
  );
}

export function Card({
  as: Tag = "div",
  padded = true,
  className,
  children,
}: { as?: ElementType; padded?: boolean; className?: string; children: ReactNode }) {
  return <Tag className={cx("ft-card", padded && "p-5", className)}>{children}</Tag>;
}

export function Tag({
  tone = "accent",
  children,
  className,
}: { tone?: "accent" | "neutral" | "profit" | "loss"; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tone === "accent" && "bg-[var(--color-tag-bg)] text-[var(--color-tag-fg)]",
        tone === "neutral" && "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg-3)]",
        tone === "profit" && "bg-[var(--color-profit)]/12 text-[var(--color-profit)]",
        tone === "loss" && "bg-[var(--color-loss)]/12 text-[var(--color-loss)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-fg-4)]", className)}>
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  delta,
  hint,
}: { label: string; value: string; delta?: { value: string; positive: boolean }; hint?: ReactNode }) {
  return (
    <Card>
      <Label>{label}</Label>
      <div className="mt-2 font-heading text-[26px] font-semibold leading-none tracking-tight text-[var(--color-fg-1)]">{value}</div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-fg-3)]">
          {delta && <Tag tone={delta.positive ? "profit" : "loss"}>{delta.value}</Tag>}
          {hint}
        </div>
      )}
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-[var(--color-fg-1)] sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-fg-3)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Logo({ size = "md", href = "/" }: { size?: "sm" | "md"; href?: string | null }) {
  const mark = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const inner = (
    <>
      {/* Dos líneas de flujo entrelazadas: el logotipo de FondTracker */}
      <svg className={cx(mark, "shrink-0 text-[var(--color-fg-1)]")} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2.5 9c2.5 0 2.5 4.2 5 4.2S10 9 12 9s2.5 4.2 5 4.2S19.5 9 21.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M2.5 15c2.5 0 2.5 4.2 5 4.2S10 15 12 15s2.5 4.2 5 4.2S19.5 15 21.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      </svg>
      <span className={cx("font-heading font-bold tracking-tight text-[var(--color-fg-1)]", size === "sm" ? "text-base" : "text-lg")}>FondTracker</span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-center gap-2.5" title="FondTracker — inicio">{inner}</a>
  ) : (
    <span className="flex items-center gap-2.5">{inner}</span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-tag-bg)] text-[var(--color-tag-fg)]">
        <Icon size={22} />
      </div>
      <h3 className="font-heading text-lg font-semibold text-[var(--color-fg-1)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-fg-3)]">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
