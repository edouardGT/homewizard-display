import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, icon, action, className = "", children }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/20 ${className}`}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {icon && <span className="text-base">{icon}</span>}
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
