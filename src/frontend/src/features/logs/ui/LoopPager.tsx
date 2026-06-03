import { useState } from "react";
import { IconButton } from "@shared/ui/primitives/IconButton";
import { Input } from "@shared/ui/primitives/Input";

type Props = {
  index: number;
  size: number;
  onChange: (index: number) => void;
};

// 0-based `index`, displayed/edited 1-based. The wrapper stops click propagation
// so the controls don't toggle the parent row's expand/collapse.
export function LoopPager({ index, size, onChange }: Props) {
  const total = Math.max(size, 1);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  const go = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), total - 1);
    if (clamped !== index) onChange(clamped);
  };

  // While editing, show the raw draft; otherwise reflect the current iteration.
  const display = focused ? draft : String(Math.min(index + 1, total));

  const commit = () => {
    setFocused(false);
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) go(parsed - 1);
  };

  return (
    <div
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        iconProps={{ name: "chevron-left" }}
        size="xs"
        type="text"
        disabled={index <= 0}
        onClick={() => go(index - 1)}
      />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span style={{ width: 56, display: "inline-block" }}>
          <Input
            type="number"
            value={display}
            onFocus={() => {
              setFocused(true);
              setDraft(String(index + 1));
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            style={{ textAlign: "center" }}
          />
        </span>
        <span style={{ fontSize: 12 }}>/ {total}</span>
      </span>
      <IconButton
        iconProps={{ name: "chevron-right" }}
        size="xs"
        type="text"
        disabled={index >= total - 1}
        onClick={() => go(index + 1)}
      />
    </div>
  );
}
