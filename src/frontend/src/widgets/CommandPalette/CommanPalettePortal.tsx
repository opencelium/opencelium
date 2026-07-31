import { createPortal } from 'react-dom';
import React from "react";

interface PortalProps {
    children: React.ReactNode;
    container?: HTMLElement;
}

export const CommandPalettePortal = ({ children, container }: PortalProps) => {
    const target =
        container ??
        document.getElementById('command-palette-content');
    if (!target) return null
    return createPortal(children, target);
};
