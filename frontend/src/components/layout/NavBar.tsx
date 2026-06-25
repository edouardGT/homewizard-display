import { NavLink } from "react-router";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/history", label: "History" },
  { to: "/plugs", label: "Plugs" },
  { to: "/settings", label: "Settings" },
];

export function NavBar() {
  return (
    <nav className="flex gap-1">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-white"
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
