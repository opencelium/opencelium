import React, { useMemo } from 'react';
import { entityRegistry } from '@/engine/entity/EntityRegistry';
import { useFetchEntitiesQuery } from '@shared/api/genericApi';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { GenericCreateWizard } from './GenericCreateWizard';
import { GenericViewWizard } from './GenericViewWizard';
import { GenericUpdateWizard } from './GenericUpdateWizard';

type Props =
    | { entityName: string; mode: 'create'; identifier?: undefined; onSuccess: () => void }
    | { entityName: string; mode: 'view'; identifier: string; onSuccess: () => void }
    | { entityName: string; mode: 'update'; identifier: string; onSuccess: () => void };

export const EntityDialogContent: React.FC<Props> = ({ entityName, mode, identifier, onSuccess }) => {
    const entity = entityRegistry.get(entityName);

    const skip = mode === 'create' || !identifier || !entity.api;
    const { data, isLoading } = useFetchEntitiesQuery(
        // Page wrappers (GenericViewPage / GenericUpdatePage) pass the same { url } shape
        // even though the query is typed as `string`; baseQuery accepts both.
        { url: `${entity.api?.baseUrl}/${identifier}` } as any,
        { skip },
    );

    const record = useMemo(() => {
        if (!data) return undefined;
        return Array.isArray(data) ? data[0] : data;
    }, [data]);

    if (mode === 'create') {
        return <GenericCreateWizard entityName={entityName} onSuccess={onSuccess} />;
    }

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Loading />
            </div>
        );
    }

    if (!record) {
        return <div style={{ padding: 24 }}>Not found</div>;
    }

    if (mode === 'view') {
        return (
            <GenericViewWizard
                entityName={entityName}
                identifier={identifier}
                initialRecord={record}
            />
        );
    }

    return (
        <GenericUpdateWizard
            entityName={entityName}
            identifier={identifier}
            initialRecord={record}
            onSuccess={onSuccess}
        />
    );
};
