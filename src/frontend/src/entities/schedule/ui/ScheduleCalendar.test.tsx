import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi, afterEach } from "vitest";
import * as cronTime from "@shared/lib/cron/upcomingRuns";
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
vi.mock("@shared/ui/primitives/Button", () => ({
  Button: ({
    testId,
    onClick,
    children,
  }: {
    testId?: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("shows every schedule with a cron expression, opens it in a dialog, highlights overlaps and navigates weeks", () => {
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("UTC");
  const schedules = [1, 2, 3, 4].map((id) => ({
    schedulerId: id,
    title: `Schedule ${id}`,
    cronExp: id === 4 ? "" : "0 0 8 * * ?",
    status: id !== 3,
    debugMode: false,
    connection: { connectionId: id, title: "Test" },
  }));
  const { container } = render(<ScheduleCalendar schedules={schedules} />);
  expect(container.querySelectorAll('[data-overlap="true"]')).toHaveLength(7);
  expect(screen.getAllByRole("button", { name: /Schedule 3/ })).toHaveLength(7);
  expect(
    screen.queryByRole("button", { name: /Schedule 4/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByTestId("schedule-calendar-event-1")[0]);
  expect(openDialog).toHaveBeenCalledWith(
    expect.objectContaining({ testId: "schedule-update-dialog" }),
  );
  expect(openDialog.mock.calls[0][0].content.props).toMatchObject({
    entityName: "schedule",
    mode: "update",
    identifier: "1",
  });
  const headers = screen
    .getAllByRole("columnheader")
    .map((header) => header.textContent);
  fireEvent.click(screen.getByTestId("schedule-calendar-next"));
  expect(
    screen.getAllByRole("columnheader").map((header) => header.textContent),
  ).not.toEqual(headers);
  fireEvent.click(screen.getByTestId("schedule-calendar-prev"));
  expect(
    screen.getAllByRole("columnheader").map((header) => header.textContent),
  ).toEqual(headers);
});

it("switches calendar views, navigates periods and can hide disabled schedules", () => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("Europe/Berlin");
  vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 10, 16, 12));
  render(<ScheduleCalendar schedules={[{
    schedulerId: 1,
    title: "Disabled schedule",
    cronExp: "0 0 8 * * ?",
    status: false,
    debugMode: false,
    connection: { connectionId: 1, title: "Test" },
  }]} />);
  const selectView = (view: string) => {
    fireEvent.click(screen.getByTestId("schedule-calendar-view"));
    fireEvent.click(screen.getByText(`schedule.calendar.${view}`, { selector: ".schedule-calendar-view-option" }));
  };
  const events = () => screen.queryAllByTestId("schedule-calendar-event-1");
  expect(events()).toHaveLength(7);
  selectView("month");
  expect(events()).toHaveLength(42);
  expect(events().filter((event) => event.closest("[data-outside-month]"))).toHaveLength(12);
  fireEvent.click(screen.getByTestId("schedule-calendar-next"));
  expect(events()).toHaveLength(35);
  fireEvent.click(screen.getByTestId("schedule-calendar-today"));
  expect(events()).toHaveLength(42);
  selectView("day");
  expect(events()).toHaveLength(1);
  expect(events()[0]).toHaveAttribute("data-disabled", "true");
  selectView("three");
  expect(events()).toHaveLength(3);
  selectView("work");
  expect(events()).toHaveLength(5);
  selectView("list");
  expect(events()).toHaveLength(6);
  expect(screen.queryByTestId("schedule-calendar-next")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("schedule-calendar-show-disabled"));
  expect(events()).toHaveLength(0);
});
