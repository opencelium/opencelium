import { useMemo } from "react";

export function useCalendarFormats(lang: string, zone: string) {
  return useMemo(() => {
    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(lang, { timeZone: zone, ...options });
    return {
      time: format({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      weekday: format({ weekday: "short" }),
      dayNumber: format({ day: "numeric" }),
      fullDay: format({ weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      longDay: format({ weekday: "short", day: "numeric", month: "long", year: "numeric" }),
      shortDate: format({ day: "numeric", month: "short" }),
      longDate: format({ day: "numeric", month: "short", year: "numeric" }),
      month: format({ month: "long", year: "numeric" }),
      weekdayName: new Intl.DateTimeFormat(lang, { timeZone: "UTC", weekday: "short" }),
      relativeDays: new Intl.RelativeTimeFormat(lang, { numeric: "auto" }),
    };
  }, [lang, zone]);
}

export type CalendarFormats = ReturnType<typeof useCalendarFormats>;
