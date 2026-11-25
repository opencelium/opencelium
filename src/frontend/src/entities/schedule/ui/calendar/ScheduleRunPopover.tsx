import { useState, type ReactElement } from "react";
import { Popover } from "antd";
import type { Schedule } from "../../model/types";
import { useOpenScheduleDialog } from "../useOpenScheduleDialog";
import { ScheduleRunCard } from "./ScheduleRunCard";
import { useScheduleColor } from "./useScheduleColor";

type Props = {
  schedule: Schedule;
  children: ReactElement;
};

export function ScheduleRunPopover({ schedule, children }: Props) {
  const [isOpen, setOpen] = useState(false);
  const colorOf = useScheduleColor();
  const openSchedule = useOpenScheduleDialog();
  return (
    <Popover
      trigger="click"
      open={isOpen}
      onOpenChange={setOpen}
      placement="bottomLeft"
      arrow={false}
      destroyOnHidden
      styles={{ container: { padding: 0, overflow: "hidden" } }}
      content={
        <ScheduleRunCard
          schedule={schedule}
          color={colorOf(schedule)}
          onOpen={() => {
            setOpen(false);
            openSchedule(schedule.schedulerId);
          }}
        />
      }
    >
      {children}
    </Popover>
  );
}
