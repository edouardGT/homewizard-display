import { useState } from "react";
import { useRenameDevice } from "../../hooks/useRenameDevice";

interface EditableNameProps {
  serial: string | null;
  name: string;
  className?: string;
}

/** Inline ✏️ rename control. Disabled when the device has no serial. */
export function EditableName({ serial, name, className = "" }: EditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const rename = useRenameDevice();

  if (!editing) {
    return (
      <span className={`group inline-flex items-center gap-1.5 ${className}`}>
        <span>{name}</span>
        {serial && (
          <button
            onClick={() => {
              setValue(name);
              setEditing(true);
            }}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            title="Rename"
            aria-label="Rename device"
          >
            ✏️
          </button>
        )}
      </span>
    );
  }

  const save = () => {
    const trimmed = value.trim();
    if (serial && trimmed && trimmed !== name) {
      rename.mutate({ serial, name: trimmed }, { onSuccess: () => setEditing(false) });
    } else {
      setEditing(false);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={save}
        className="w-48 rounded border border-border bg-surface-2 px-2 py-0.5 text-sm text-white outline-none focus:border-accent"
      />
      {rename.isPending && <span className="text-xs text-muted">…</span>}
    </span>
  );
}
