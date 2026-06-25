import { usePlugPower } from "../../hooks/usePlugPower";

interface PowerToggleProps {
  serial: string | null;
  on: boolean | null | undefined;
  locked?: boolean | null;
  online?: boolean;
}

/** On/off switch for a socket. Disabled when offline, locked, or state unknown. */
export function PowerToggle({ serial, on, locked, online = true }: PowerToggleProps) {
  const power = usePlugPower();
  if (on === null || on === undefined || !serial) return null;

  const disabled = !online || !!locked || power.isPending;
  const title = locked ? "Switch-locked on the device" : !online ? "Offline" : on ? "Turn off" : "Turn on";

  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label="Toggle power"
      disabled={disabled}
      title={title}
      onClick={() => serial && power.mutate({ serial, on: !on })}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-[var(--color-positive)]" : "bg-surface-2"
      } ${disabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
      {locked && <span className="absolute -right-4 text-[10px]">🔒</span>}
    </button>
  );
}
