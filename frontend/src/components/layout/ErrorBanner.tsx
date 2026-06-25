interface ErrorBannerProps {
  message: string;
  variant?: "error" | "warning" | "stale";
}

const styles = {
  error: "border-red-500/40 bg-red-500/10 text-red-200",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  stale: "border-amber-500/30 bg-amber-500/5 text-amber-300/80",
};

export function ErrorBanner({ message, variant = "error" }: ErrorBannerProps) {
  return (
    <div className={`rounded-xl border px-4 py-2 text-sm ${styles[variant]}`}>{message}</div>
  );
}
