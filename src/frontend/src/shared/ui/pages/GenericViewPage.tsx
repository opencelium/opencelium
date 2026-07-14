import React, {useEffect, useMemo} from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@pages/PageWrapper/PageWrapper';
import { GenericViewWizard } from '@/engine/entity/runtime/genererics/GenericViewWizard';
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {entityRegistry} from "@/engine/entity/EntityRegistry.ts";
import {useFetchEntitiesQuery} from "@shared/api/genericApi.ts";

type Props = {
    entityName: string;
};

export const GenericViewPage: React.FC<Props> = ({ entityName }) => {

    const { isContentLoading, toggleIsContentLoading} = useLayoutStore();
    const { id: rawId } = useParams(); // 👈 /:id
    const id = rawId ? decodeURIComponent(rawId) : rawId;

    const entity = entityRegistry.get(entityName);

    // 🔥 fetch entity
    // A mutation elsewhere (e.g. a command-palette delete of this same record)
    // broadly invalidates the 'Entity' tag, so this still-mounted query refetches
    // and 404s. ignoreError skips the global error toast — the "Not found" state
    // below already covers a missing record.
    const { data, isLoading } = useFetchEntitiesQuery(
        {
            url: `${entity.api?.baseUrl}/${id}`,
            customOptions: { ignoreError: true },
        },
        {
            skip: !id || !entity.api,
        }
    );
    useEffect(() => {
        if (isLoading && !isContentLoading) {
            toggleIsContentLoading(true);
        }
        if (!isLoading && isContentLoading) {
            toggleIsContentLoading(false);
        }
    }, [isLoading]);

    const record = useMemo(() => {
        if (!data) return undefined;

        // if API wraps the payload
        return Array.isArray(data) ? data[0] : data;
    }, [data]);

    if (isLoading) {
        return null;
    }

    if (!record) {
        return <div>Not found</div>;
    }


    return (
        <PageWrapper>
            <GenericViewWizard
                entityName={entityName}
                identifier={id}
                initialRecord={record}
            />
        </PageWrapper>
    );
};
