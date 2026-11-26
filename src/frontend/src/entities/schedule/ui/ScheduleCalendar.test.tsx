import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as cronTime from "@shared/lib/cron/upcomingRuns";
import type { Schedule } from "../model/types";
import { ScheduleCalendar } from "./ScheduleCalendar";

vi.mock("../model/useScheduleUpdatePermission", () => ({
  useScheduleUpdatePermission: () => true,
}));
const openDialog = vi.fn();
vi.mock("@shared/ui/dialog/useDialog", () => ({
  useDialog: () => ({ open: openDialog, closeById: vi.fn() }),
}));
vi.mock("@/engine/entity/runtime/genererics/EntityDialogContent", () => ({
  EntityDialogContent: () => null,
}));
vi.mock("@shared/i18n/hooks/useI18n", () => ({
  useI18n: () => ({ t: (key: string) => key, lang: "en" }),
}));
vi.mock("@shared/theme/hooks/useTheme", () => ({
  useTheme: () => ({ themeMode: "light" }),
}));
vi.mock("@entities/subscription/model/useSubscriptionIssue", () => ({
  useSubscriptionIssue: () => ({ issue: null }),
}));
const runNow = vi.fn();
vi.mock("./useRunScheduleNow", () => ({
  useRunScheduleNow: () => ({ run: runNow, pending: false }),
}));
type ButtonMockProps = { testId?: string; onClick?: () => void; children?: React.ReactNode };
vi.mock("@shared/ui/primitives/Button", () => ({
  Button: ({ testId, onClick, children }: ButtonMockProps) => (
    <button data-testid={testId} onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@shared/ui/primitives/IconButton", () => ({
  IconButton: ({ testId, onClick }: ButtonMockProps) => <button data-testid={testId} onClick={onClick} />,
}));
vi.mock("@shared/ui/primitives/Tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const schedule = (schedulerId: number, cronExp: string, extra: Partial<Schedule> = {}): Schedule => ({
  schedulerId,
  title: `Schedule ${schedulerId}`,
  cronExp,
  status: true,
  debugMode: false,
  connection: { connectionId: schedulerId, title: "Workflow" },
  ...extra,
});
const events = (id: number) => screen.queryAllByTestId(`schedule-calendar-event-${id}`);
const selectView = (view: string) => fireEvent.click(screen.getByTestId(`schedule-calendar-view-${view}`));

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 10, 24, 12));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
  }));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  openDialog.mockClear();
});

it("lays out a week with quiet bands, clash hatching, hidden runs and the run popover", () => {
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("UTC");
  const failed = { success: { startTime: 1, taId: "a" }, fail: { startTime: 2, taId: "b" } };
  render(<ScheduleCalendar onShowList={vi.fn()} schedules={[
    schedule(1, "0 0 8 * * ?"),
    schedule(2, "0 2 8 * * ?"),
    schedule(3, "0 30 8 * * ?", { status: false, lastExecution: failed }),
    schedule(4, ""),
  ]} />);

  expect(events(1)).toHaveLength(7);
  expect(events(2)).toHaveLength(7);
  expect(events(3)).toHaveLength(0);
  expect(events(4)).toHaveLength(0);
  expect(document.querySelectorAll('[data-overlap="true"]')).toHaveLength(7);
  const more = screen.getAllByTestId("schedule-calendar-more");
  expect(more).toHaveLength(7);
  expect(more[0]).toHaveAttribute("data-failed", "true");

  expect(screen.getAllByRole("rowheader").map((row) => row.textContent)).toEqual(["08:00"]);
  fireEvent.click(screen.getByTestId("schedule-calendar-band-0"));
  expect(screen.getAllByRole("rowheader")).toHaveLength(9);

  fireEvent.click(events(1)[0]);
  const card = screen.getByTestId("schedule-run-card-1");
  expect(within(card).getByText("schedule.cronText.daily")).toBeInTheDocument();
  expect(within(card).queryByTestId("schedule-run-status-1")).toBeNull();
  fireEvent.click(within(card).getByTestId("schedule-run-open-1"));
  expect(openDialog.mock.calls[0][0].content.props).toMatchObject({
    entityName: "schedule",
    mode: "update",
    identifier: "1",
  });

  const range = screen.getByText(/–/, { selector: ".schedule-calendar-range" }).textContent;
  fireEvent.click(screen.getByTestId("schedule-calendar-next"));
  expect(screen.getByText(/–/, { selector: ".schedule-calendar-range" }).textContent).not.toBe(range);
  fireEvent.click(screen.getByTestId("schedule-calendar-prev"));
  expect(screen.getByText(/–/, { selector: ".schedule-calendar-range" }).textContent).toBe(range);
});

it("opens the day behind '+N more' when no hidden run failed", () => {
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("UTC");
  render(<ScheduleCalendar schedules={[1, 2, 3].map((id) => schedule(id, "0 0 8 * * ?"))} />);
  expect(events(3)).toHaveLength(0);
  fireEvent.click(screen.getAllByTestId("schedule-calendar-more")[0]);
  expect(screen.getByTestId("schedule-calendar")).toHaveAttribute("data-view", "day");
  expect(events(3)).toHaveLength(1);
});

it("switches views, navigates periods and returns to the schedule list", () => {
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("Europe/Berlin");
  vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 10, 16, 12));
  const showList = vi.fn();
  render(<ScheduleCalendar onShowList={showList} schedules={[schedule(1, "0 0 8 * * ?", { status: false })]} />);
  expect(events(1)).toHaveLength(7);
  selectView("month");
  expect(events(1)).toHaveLength(42);
  expect(events(1).filter((event) => event.closest("[data-outside-month]"))).toHaveLength(12);
  fireEvent.click(screen.getByTestId("schedule-calendar-next"));
  expect(events(1)).toHaveLength(35);
  fireEvent.click(screen.getByTestId("schedule-calendar-today"));
  expect(events(1)).toHaveLength(42);
  selectView("day");
  expect(events(1)).toHaveLength(1);
  expect(events(1)[0]).not.toHaveAttribute("data-disabled");
  selectView("agenda");
  expect(events(1)).toHaveLength(7);
  expect(screen.queryByText("schedule.run.paused")).toBeNull();
  selectView("list");
  expect(showList).toHaveBeenCalledOnce();
});
