import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi, afterEach } from "vitest";
import * as cronTime from "@shared/lib/cron/upcomingRuns";
import { ScheduleCalendar } from "./ScheduleCalendar";

vi.mock("../model/useScheduleUpdatePermission", () => ({
  useScheduleUpdatePermission: () => true,
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
});
it("highlights overlapping schedules and exposes navigation and disabled markers", () => {
  vi.spyOn(cronTime, "getScheduleTimeZone").mockReturnValue("UTC");
  const schedules = [1, 2, 3].map((id) => ({
    schedulerId: id,
    title: `Schedule ${id}`,
    cronExp: "0 0 8 * * ?",
    status: id !== 3,
    debugMode: false,
    connection: { connectionId: id, title: "Test" },
  }));
  const { container } = render(
    <MemoryRouter>
      <ScheduleCalendar schedules={schedules} />
    </MemoryRouter>,
  );
  expect(container.querySelectorAll('[data-overlap="true"]')).toHaveLength(7);
  expect(
    screen.queryByRole("link", { name: /Schedule 3/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: /Schedule 1/ })[0],
  ).toHaveAttribute("href", "/schedule/update/1");
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
  fireEvent.click(screen.getByTestId("schedule-calendar-disabled"));
  expect(screen.getAllByRole("link", { name: /Schedule 3/ })).toHaveLength(7);
  expect(screen.getAllByRole("link", { name: /Schedule 3/ })[0]).toHaveClass(
    "schedule-calendar-disabled",
  );
});
