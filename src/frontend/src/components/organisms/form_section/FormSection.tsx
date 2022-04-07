/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

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
        <FormSectionStyled isVisible={isVisible} padding={`${hasLabel ? '50px' : '20px'} 30px 20px 10px`} margin={`${hasLabel ? '31px' : '10px'} 0 0`}>
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