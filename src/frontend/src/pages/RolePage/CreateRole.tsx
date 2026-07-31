import React from 'react';
import {EntityWizard} from "@/engine/entity/runtime/EntityWizard.tsx";
import PageWrapper from "@pages/PageWrapper/PageWrapper.tsx";

const CreateRolePage = (props) => (
    <PageWrapper>
        <EntityWizard
            entityName={'role'}
            mode="create"
            onSubmit={() => {}}
        />
    </PageWrapper>
);

export default CreateRolePage;
