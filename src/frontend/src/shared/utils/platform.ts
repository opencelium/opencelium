/** True on macOS/iOS — used to pick Cmd- vs Ctrl-flavored shortcut hints and glyphs. */
export const IS_MAC =
    typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/i.test(navigator.platform || navigator.userAgent || '');
