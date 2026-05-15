import React from 'react';
import {FormInput} from "@shared/ui/form/FormInput";
import type {StepForm} from "@shared/ui/step-form/types.ts";

const UserDetailsStep = ({readOnly}: StepForm) => (
    <React.Fragment>
        <FormInput readOnly={readOnly} name={"userDetail.name"} label={"Name"} autoFocus/>
        <FormInput readOnly={readOnly} name={"userDetail.surname"} label={"Surname"} />
        <FormInput readOnly={readOnly} name={"userDetail.department"} label={"Department"} />
        <FormInput readOnly={readOnly} name={"userDetail.organization"} label={"Organization"} />
        <FormInput readOnly={readOnly} name={"userDetail.phoneNumber"} label={"Phone Number"} />
    </React.Fragment>
);

export default UserDetailsStep;
