import type { ReactNode } from "react";
import { Dialog } from "@shared/ui/primitives/Dialog";

type Props = {
  title: string;
  content: ReactNode;
  onClose: () => void;
};

// One request/response body blown up to the whole screen, for payloads too big for its tab.
export function MaximizedBodyDialog({ title, content, onClose }: Props) {
  return (
    <Dialog open fullscreen onClose={onClose} title={title} testId="logs-maximized-body">
      <div style={{ height: "calc(100vh - 80px)", boxSizing: "border-box", overflow: "auto",
        border: "1px solid var(--color-border-default)", borderRadius: 6 }}>
        {content}
      </div>
    </Dialog>
  );
}
