/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import Inputs from "./inputs/Inputs";
import {Label} from "./label/Label";
import { FormSectionProps } from './interfaces';
import { FormSectionStyled } from './styles';

const FormSection: FC<FormSectionProps> =
    ({
        overflow,
        position,
        label,
        dependencies,
        children,
        padding,
        inputsStyle,
    }) => {
    let isVisible = true;
    for(let i = 0; i < dependencies.length; i++){
        if(dependencies[i]){
            isVisible = false;
        }
    }
    const hasLabel = label !== null;
    return (
        <FormSectionStyled position={position} overflow={overflow} isVisible={isVisible} padding={padding ? padding : `${hasLabel ? '50px' : '20px'} 30px 20px 10px`} margin={`${hasLabel ? '31px' : '0'} 0 0`}>
            {hasLabel && <Label {...label} position={'absolute'}/>}
            <Inputs style={inputsStyle}>{children}</Inputs>
        </FormSectionStyled>
    )
}

FormSection.defaultProps = {
    hasFullWidthInForm: false,
    dependencies: [],
    label: null,
    padding: '',
    overflow: '',
    position: '',
    styles: {},
    inputsStyle: {},
}


export {
    FormSection,
};

export default withTheme(FormSection);
