import React from 'react';
import {EntityWizard} from "@/engine/entity/runtime/EntityWizard.tsx";
import PageWrapper from "@pages/PageWrapper/PageWrapper.tsx";

const CreateConnectorPage = (props) => (
    <PageWrapper>
        <EntityWizard
            entityName={'connector'}
            mode="create"
            onSubmit={() => {}}
        />
    </PageWrapper>
);

export default CreateConnectorPage;
