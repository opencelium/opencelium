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

import React from 'react';
import {Card as CardComponent} from "@app_component/base/card/Card";
import styled, {withTheme} from "styled-components";
import InputText from "@app_component/base/input/text/InputText";
import Label from "@molecule/../../components/form/form_section/label/Label";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";

const TemplateWithTheme = withTheme(CardComponent);

const Template = args => <TemplateWithTheme {...args}/>

const InputsStyled = styled.div`
    &>:not(:last-child){
        margin-bottom: 5px;
    }
`

export const Card = Template.bind({})
Card.args = {
    margin: '20px',
    padding: '20px 10px',
    children: <div style={{position: 'relative', paddingTop: '20px'}}>
        <Label value={"user details"} top={'-45px'} left={'10px'} position={'absolute'}/>
        <InputsStyled>
            <InputText isLoading label={'Test'} value={'test'}/>
            <InputText icon={'person'} value={'test'}/>
            <InputText isLoading icon={'person'} label={'Test'} value={'test'}/>
            <InputText icon={'person'} label={'Test'} value={'value'} maxLength={20}/>
            <InputTextarea icon={'person'} label={'Test'} value={'name'} maxLength={20}/>
            <InputTextarea icon={'person'} label={'Test'} value={'Description'} maxLength={20}/>
            <InputText icon={'person'} label={'Test'} value={'name'} maxLength={20}/>
        </InputsStyled>
    </div>
}

export default {
    title: 'Atoms/Card',
    component: TemplateWithTheme,
}