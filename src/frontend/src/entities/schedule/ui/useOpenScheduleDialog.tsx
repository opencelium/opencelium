import { useCallback } from "react";
import { useDialog } from "@shared/ui/dialog/useDialog";
import { buildTestId } from "@shared/testing/testId";
import { EntityDialogContent } from "@/engine/entity/runtime/genererics/EntityDialogContent";
import { useScheduleUpdatePermission } from "../model/useScheduleUpdatePermission";

export function useOpenScheduleDialog() {
  const dialog = useDialog();
  const canUpdate = useScheduleUpdatePermission();

  return useCallback(
    (schedulerId: number) => {
      const mode = canUpdate ? "update" : "view";
      const id = dialog.open({
        width: 1000,
        top: 18,
        testId: buildTestId("schedule", `${mode}-dialog`),
        content: (
          <EntityDialogContent
            entityName="schedule"
            mode={mode}
            identifier={String(schedulerId)}
            onSuccess={() => dialog.closeById(id)}
          />
        ),
      });
    },
    [dialog, canUpdate],
  );
}
