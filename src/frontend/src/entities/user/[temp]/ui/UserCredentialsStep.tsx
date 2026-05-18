import React from 'react';
import type {StepForm} from "@shared/ui/step-form/types.ts";
import {FormInput} from "@shared/ui/form/FormInput";

const UserCredentialsStep = ({readOnly}: StepForm) => (
    <React.Fragment>
        <FormInput readOnly={readOnly} name={"email"} label={"Email"} autoFocus/>
        <FormInput readOnly={readOnly} name={"password"} label={"Password"} type={'password'}/>
        <FormInput readOnly={readOnly} name={"repeatPassword"} label={"Repeat Password"} type={'password'}/>
    </React.Fragment>
);

export default UserCredentialsStep;
