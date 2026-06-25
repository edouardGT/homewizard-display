import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="mt-2 text-muted">This page does not exist.</p>
      <Link to="/" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
        Back to dashboard
      </Link>
    </div>
  );
}
