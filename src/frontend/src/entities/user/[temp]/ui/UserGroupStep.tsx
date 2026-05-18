import React from 'react';
import type {StepForm} from "@shared/ui/step-form/types.ts";
import {FormSelect} from "@shared/ui/form/FormSelect";

const UserGroupStep = ({readOnly}: StepForm) => (
    <React.Fragment>
        <FormSelect
            readOnly={readOnly}
            name="userGroup"
            label="Role"
            required
            placeholder="Select role"
            options={[
                { value: 1, label: 'Admin' },
                { value: 2, label: 'User' },
            ]}
        />
    </React.Fragment>
);

export default UserGroupStep;
