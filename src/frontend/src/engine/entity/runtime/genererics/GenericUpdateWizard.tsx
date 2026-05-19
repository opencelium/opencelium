import React, {useMemo} from 'react';
import { entityRegistry } from "@/engine/entity/EntityRegistry";
import { EntityWizard } from "@/engine/entity/runtime/EntityWizard";
import { useUpdateEntityMutation } from "@/shared/api/genericApi";
import { apiExecutor } from "@shared/api/apiExecutor";
import {runStage} from "@/engine/entity/runtime/genererics/utils.ts";

interface Props {
    entityName: string;
    identifier: string;
    initialRecord?: any;
    onSuccess?: () => void;
}

export const GenericUpdateWizard: React.FC<Props> =
    ({
        entityName,
        identifier,
        initialRecord,
        onSuccess,
     }) => {
    const entity = entityRegistry.get(entityName);
    const initialValues = useMemo(() => {
        if (!initialRecord || !entity.api) return undefined;
        return entity.api.mapToForm ? entity.api.mapToForm(initialRecord) : initialRecord;
    }, [initialRecord, entity]);

    const [updateTrigger] = useUpdateEntityMutation();

    const handleSubmit = async (formData: any) => {
        try {
            const payload = entity?.api?.mapToApi
                ? entity.api.mapToApi({mode: 'update', data: formData})
                : formData;

            const onSubmit = entity.wizard?.modes?.update?.onSubmit;
            if (onSubmit) {
                await onSubmit(payload);
            }

            if (entity?.api) {
                const ctx = {
                    payload,
                    mode: 'update',
                    entity,
                    identifier,
                };

                const lifecycle = entity.api.lifecycle?.update;
                const updateOp = entity.api.operations?.update;

                await runStage(lifecycle?.before, ctx, entity);

                if (updateOp) {
                    const method = updateOp.method ?? 'PUT';
                    const url = updateOp.buildUrl
                        ? updateOp.buildUrl(entity.api.baseUrl, identifier)
                        : `${entity.api.baseUrl}/${identifier}`;

                    await apiExecutor({
                        url,
                        method,
                        body: payload,
                        options: {
                            headers: entity.api.getHeaders?.({ mode: 'update' }) || {},
                        },
                    });
                } else {
                    const response = await updateTrigger({
                        url: `${entity.api.baseUrl}/${identifier}`,
                        body: payload,
                        headers: entity.api.getHeaders?.({ mode: 'update' }) || {},
                    }).unwrap();

                    await runStage(lifecycle?.after, { ...ctx, formData, response }, entity);
                }
            }
            onSuccess?.();
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    return (
        <EntityWizard
            entityName={entityName}
            mode="update"
            initialValues={initialValues}
            onSubmit={handleSubmit}
            header={entity.wizard.modes?.update?.header || `${entity.name}: ${identifier}`}
            subheader={entity.wizard.modes?.update?.subheader}
        />
    );
};
