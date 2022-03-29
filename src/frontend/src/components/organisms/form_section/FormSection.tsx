import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { FormSectionProps } from './interfaces';
import { FormSectionStyled } from './styles';
import Label from "@molecule/form_section/label/Label";
import {Inputs} from "@molecule/form_section/inputs/Inputs";

const FormSection: FC<FormSectionProps> =
    ({
         label,
         dependencies,
         children,
    }) => {
    let isVisible = true;
    for(let i = 0; i < dependencies.length; i++){
        if(dependencies[i]){
            isVisible = false;
        }
    }
    const hasLabel = label !== null;
    return (
        <FormSectionStyled isVisible={isVisible} padding={`${hasLabel ? '50px' : '20px'} 10px 20px`} margin={`${hasLabel ? '31px' : '10px'} 0 0`}>
            {hasLabel && <Label {...label} position={'absolute'}/>}
            <Inputs>{children}</Inputs>
        </FormSectionStyled>
    )
}

FormSection.defaultProps = {
    hasFullWidthInForm: false,
    dependencies: [],
    label: null,
}


export {
    FormSection,
};

export default withTheme(FormSection);