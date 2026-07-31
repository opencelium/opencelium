import React from 'react';
import PageWrapper from '@pages/PageWrapper/PageWrapper';
import { GenericCreateWizard } from '@/engine/entity/runtime/genererics/GenericCreateWizard';

type Props = {
    entityName: string;
};

export const GenericCreatePage: React.FC<Props> = ({ entityName }) => {
    return (
        <PageWrapper>
            <GenericCreateWizard entityName={entityName} />
        </PageWrapper>
    );
};
