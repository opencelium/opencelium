import { createContext, useContext } from 'react';

/** Lets dialog content adapt its layout when the dialog is shown fullscreen. */
const DialogFullscreenContext = createContext(false);

export const DialogFullscreenProvider = DialogFullscreenContext.Provider;

// eslint-disable-next-line react-refresh/only-export-components
export function useDialogFullscreen(): boolean {
    return useContext(DialogFullscreenContext);
}
