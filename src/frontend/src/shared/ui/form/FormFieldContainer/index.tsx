import React from 'react';
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import {FormControl} from "@shared/ui/form/FormControl";
import {FieldContainer} from "@shared/ui/primitives/FieldContainer";
import type {FieldContainerProps} from "@shared/ui/primitives/FieldContainer/FieldContainer.types.ts";
interface FormFieldContainerProps {
    hint?: string;
    error?: string;
    fieldContainerProps: FieldContainerProps;
}

const FormFieldContainer = ({error, hint, children, fieldContainerProps}: FormFieldContainerProps) => {
    return (
        <FormControl
            hint={hint}
            error={error}
        >
            <FieldContainer
                {...fieldContainerProps}
            >
                {children}
            </FieldContainer>
        </FormControl>
    )
}

export default FormFieldContainer;
