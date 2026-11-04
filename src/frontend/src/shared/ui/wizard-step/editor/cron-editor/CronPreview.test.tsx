import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import * as cronTime from "@shared/lib/cron/upcomingRuns";
import { CronPreview } from "./CronPreview";

vi.mock("@shared/i18n/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string, values?: { zone: string }) => values?.zone ?? key,
    lang: "en",
  }),
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it("replaces elapsed runs and displays the browser zone", () => {
  vi.useFakeTimers().setSystemTime(new Date("2026-11-04T00:14:59Z"));
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("Asia/Tashkent");
  const { container } = render(<CronPreview cron="0 0/15 * * * ?" />);
  expect(screen.getByText("Asia/Tashkent")).toBeVisible();
  expect(container.querySelector("time")?.dateTime).toBe(
    "2026-11-04T00:15:00.000Z",
  );
  act(() => vi.advanceTimersByTime(2000));
  expect(container.querySelector("time")?.dateTime).toBe(
    "2026-11-04T00:30:00.000Z",
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(5);
});
it("updates errors and impossible dates while typing", () => {
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("UTC");
  const { rerender } = render(<CronPreview cron="bad" />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "schedule.preview.invalid",
  );
  rerender(<CronPreview cron="0 0 8 30 2 ?" />);
  expect(screen.getByTestId("schedule-cron-preview")).toHaveTextContent(
    "schedule.preview.empty",
  );
  rerender(<CronPreview cron="0 0 8 * * ?" />);
  expect(screen.getAllByRole("listitem")).toHaveLength(5);

});

it.each([
  ["UTC", "2026-11-04T08:00:00.000Z"],
  ["America/New_York", "2026-11-04T13:00:00.000Z"],
])("uses the browser zone %s for the preview", (zone, expected) => {
  vi.useFakeTimers().setSystemTime(new Date("2026-11-04T00:00:00Z"));
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue(zone);
  const {container} = render(<CronPreview cron="0 0 8 * * ?" />);
  expect(screen.getByText(zone)).toBeVisible();
  expect(container.querySelector("time")?.dateTime).toBe(expected);
});
