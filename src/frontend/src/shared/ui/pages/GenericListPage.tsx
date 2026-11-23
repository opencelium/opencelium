import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { rememberListLocation } from '@shared/navigation/listLocation';
import PageWrapper from '@pages/PageWrapper/PageWrapper';
import { GenericEntityList } from '@/engine/entity/runtime/genererics/GenericEntityList';

type Props = {
    entityName: string;
};

export const GenericListPage: React.FC<Props> = ({ entityName }) => {
    const { pathname, search } = useLocation();
    useLayoutEffect(() => rememberListLocation(pathname, search), [pathname, search]);

    return (
        <PageWrapper resetOnNavigation={false}>
            <GenericEntityList key={entityName} entityName={entityName} syncUrl />
        </PageWrapper>
    );
};
