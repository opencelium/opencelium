import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

// The dialog exposes a slot in its header (next to the maximize/close icons).
// Content can contribute actions there while keeping access to its own state.
const DialogHeaderSlotContext = createContext<HTMLElement | null>(null);

export const DialogHeaderSlotProvider = DialogHeaderSlotContext.Provider;

export function DialogHeaderActions({ children }: { children: ReactNode }) {
  const slot = useContext(DialogHeaderSlotContext);
  return slot ? createPortal(children, slot) : null;
}
