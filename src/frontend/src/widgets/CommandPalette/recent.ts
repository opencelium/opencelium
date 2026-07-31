const STORAGE_KEY = 'oc_cmd_recent';
const MAX_RECENT = 5;

export const getRecentCommands = (): string[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((v): v is string => typeof v === 'string').slice(0, MAX_RECENT);
    } catch {
        return [];
    }
};

export const pushRecentCommand = (value: string): string[] => {
    const trimmed = value.trim();
    if (!trimmed) return getRecentCommands();
    const existing = getRecentCommands().filter(v => v !== trimmed);
    const next = [trimmed, ...existing].slice(0, MAX_RECENT);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // ignore quota / disabled storage
    }
    return next;
};
