// 6 → 5
export const stripSeconds = (cron?: string) => {
    if (!cron) return '';
    const parts = cron.trim().split(' ');
    return parts.length === 6 ? parts.slice(1).join(' ') : cron;
};

// 5 → 6
export const addSeconds = (cron?: string) => {
    if (!cron) return '';
    const parts = cron.trim().split(' ');
    return parts.length === 5 ? `0 ${cron}` : cron;
};
export const hasSeconds = (cron?: string) => {
    if (!cron) return false;
    const parts = cron.trim().split(' ');
    return parts.length === 6;
};
export const normalizeCron = (value: string): string => {
    if (!value) return '';

    return value
        .replace(/\s+/g, ' ') // multiple spaces → one
        .trim();              // strip leading/trailing spaces
};

// Quartz requires exactly one of day-of-month / day-of-week to be `?`.
// `react-js-cron` is a standard 5-field picker and never emits `?`, so a
// 6-field expression coming from the picker (e.g. `0 7 * * * *`) is rejected
// by Quartz with "both day-of-week AND day-of-month not implemented". This
// rewrites such an expression to be Quartz-safe by blanking the wildcard day
// field, defaulting to day-of-week when both are wildcards.
export const toQuartzDayRule = (cron?: string): string => {
    if (!cron) return '';
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 6) return cron;
    const [sec, min, hour, dom, month, dow] = parts;
    if (dom === '?' || dow === '?') return parts.join(' ');
    if (dow === '*') return [sec, min, hour, dom, month, '?'].join(' ');
    if (dom === '*') return [sec, min, hour, '?', month, dow].join(' ');
    // Both day fields are specific values — Quartz can't run this; blank dow
    // as the safer default so the value is at least parsable.
    return [sec, min, hour, dom, month, '?'].join(' ');
};
