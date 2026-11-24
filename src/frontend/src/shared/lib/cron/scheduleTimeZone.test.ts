import { afterEach, expect, it } from "vitest";
import { runtimeConfig } from "@shared/config/runtimeConfig";
import { getScheduleTimeZone } from "./upcomingRuns";

afterEach(() => {
  runtimeConfig.serverTimeZone = undefined;
});

it("uses the server time zone from runtime config", () => {
  runtimeConfig.serverTimeZone = "America/New_York";
  expect(getScheduleTimeZone()).toBe("America/New_York");
});

it("falls back to the browser time zone", () => {
  expect(getScheduleTimeZone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
});
