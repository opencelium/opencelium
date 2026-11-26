import type { Schedule } from "../../model/types";

export const scheduleName = (schedule: Schedule) => schedule.title || schedule.connection.title;
