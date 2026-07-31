import React from 'react';
import {EntityWizard} from "@/engine/entity/runtime/EntityWizard.tsx";
import PageWrapper from "@pages/PageWrapper/PageWrapper.tsx";

const CreateSchedulePage = (props) => (
    <PageWrapper>
        <EntityWizard
            entityName={'schedule'}
            mode="create"
            onSubmit={() => {}}
        />
    </PageWrapper>
);

export default CreateSchedulePage;
