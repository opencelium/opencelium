// Copies text to the clipboard, working in both secure and non-secure contexts.
//
// The async Clipboard API (`navigator.clipboard`) is only exposed in secure
// contexts (HTTPS / localhost); over plain HTTP it is undefined or rejects. To
// stay functional everywhere we fall back to the legacy `document.execCommand
// ('copy')` over a hidden, off-screen <textarea>. Returns whether the copy
// succeeded so callers can show the right toast.
export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to the legacy path (e.g. transient permission denial).
        }
    }
    return copyWithExecCommand(text);
}

function copyWithExecCommand(text: string): boolean {
    if (typeof document === 'undefined') return false;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    // Keep it out of view and non-interactive, but still selectable.
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    const previousSelection = document.activeElement as HTMLElement | null;

    try {
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        return document.execCommand('copy');
    } catch {
        return false;
    } finally {
        document.body.removeChild(textarea);
        // Restore focus so copying doesn't steal it from the active element.
        previousSelection?.focus?.();
    }
}
