import React, { useMemo } from 'react';
import { entityRegistry } from "@/engine/entity/EntityRegistry.ts";
import { EntityWizard } from "@/engine/entity/runtime/EntityWizard.tsx";

interface Props {
    entityName: string;
    identifier: string;
    initialRecord?: any;
}

export const GenericViewWizard: React.FC<Props> =
    ({
         entityName,
         identifier,
         initialRecord,
    }) => {
    const entity = entityRegistry.get(entityName);

    const initialValues = useMemo(() => {
        if (!initialRecord || !entity.api) return undefined;
        return entity.api.mapToForm ? entity.api.mapToForm(initialRecord) : initialRecord;
    }, [initialRecord, entity]);
    return (
        <EntityWizard
            readOnly={true}
            entityName={entityName}
            mode="view"
            initialValues={initialValues}
            header={entity.wizard.modes?.view?.header || `${entity.name}: ${identifier}`}
            subheader={entity.wizard.modes?.view?.subheader}
        />
    );
};
