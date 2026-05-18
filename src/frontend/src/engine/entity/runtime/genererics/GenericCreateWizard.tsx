import React from 'react';
import { entityRegistry } from "@/engine/entity/EntityRegistry";
import { EntityWizard } from "@/engine/entity/runtime/EntityWizard";
import {genericApi, useCreateEntityMutation} from "@/shared/api/genericApi";

interface Props {
    entityName: string;
    onSuccess?: () => void;
}

export const GenericCreateWizard: React.FC<Props> = ({ entityName, onSuccess }) => {
    const entity = entityRegistry.get(entityName);
    const [createTrigger] = useCreateEntityMutation();

    const handleSubmit = async (data: any) => {
        try {
            // If the definition has a "to backend" mapper, use it
            const payload = entity?.api?.mapToApi ? entity.api.mapToApi({mode: 'create', data}) : data;
            if (entity.api) {
                await createTrigger({
                    url: entity.api.baseUrl,
                    body: payload,
                    headers: entity?.api?.getHeaders?.({mode: 'update'}) || {},
                }).unwrap();
            }
            onSuccess?.();
        } catch (error) {
            console.error(`Failed to create ${entityName}:`, error);
            throw error;
        }
    };

    return (
        <EntityWizard
            entityName={entityName}
            mode="create"
            onSubmit={handleSubmit}
        />
    );
};
