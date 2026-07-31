import React from 'react';
import PageWrapper from '@pages/PageWrapper/PageWrapper';
import { GenericEntityList } from '@/engine/entity/runtime/genererics/GenericEntityList';

type Props = {
    entityName: string;
};

export const GenericListPage: React.FC<Props> = ({ entityName }) => {
    return (
        <PageWrapper>
            <GenericEntityList entityName={entityName} />
        </PageWrapper>
    );
};
