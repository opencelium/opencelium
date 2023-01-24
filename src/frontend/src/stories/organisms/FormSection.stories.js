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

import React from 'react';
import {FormSection as FormSectionComponent} from "@organism/../../components/form_section/FormSection";
import {withTheme} from "styled-components";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import InputRadios from "@app_component/base/input/radio/InputRadios";
import InputFile from "@app_component/base/input/file/InputFile";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import InputSelect from "@app_component/base/input/select/InputSelect";

const TemplateWithTheme = withTheme(FormSectionComponent);

const Template = args => <TemplateWithTheme {...args}/>


export const UserDetails = Template.bind({})
UserDetails.args = {
    label: {value: "user details"},
    children: (
        <React.Fragment>
            <InputRadios icon={<span/>} label={'Title'} value={'mr'} options={[{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}]}/>
            <InputText icon={'perm_identity'} label={'Name'} value={'John'} required maxLength={128}/>
            <InputText icon={'perm_identity'} label={'Surname'} value={'Snow'} required maxLength={128}/>
            <InputText icon={'phone'} label={'Phone Number'} value={'+49745454544'} required/>
            <InputText icon={'people'} label={'Department'} value={'Sales'} required/>
            <InputText icon={'domain'} label={'Organization'} value={'Becon'} required/>
            <InputFile label={'Avatar'} icon={'photo'}/>
        </React.Fragment>
    )
}
export const Credentials = Template.bind({})
Credentials.args = {
    label: {value: "credentials"},
    children: (
        <React.Fragment>
            <InputText icon={'email'} label={'Email'} value={'admin@opencelium.io'} required maxLength={255}/>
            <InputText icon={'vpn_key'} label={'Password'} value={'1111111111'} required type={InputTextType.Password} maxLength={16}/>
            <InputText icon={'vpn_key'} label={'Repeat Password'} value={'1111111111'} required type={InputTextType.Password} maxLength={16}/>
        </React.Fragment>
    )
}
export const UserGroup = Template.bind({})
UserGroup.args = {
    label: {value: "user group"},
    children: (
        <React.Fragment>
            <InputSelect icon={'supervised_user_circle'} label={'User Group'} options={[
                {value: 'admin', label: 'Label'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                {value: 'user', label: 'user'},
                ]} required/>
            <InputTextarea icon={'notes'} label={'Description'} value={'Here you will see the description of the role'} readOnly/>
        </React.Fragment>
    )
}
export const GeneralData = Template.bind({})
GeneralData.args = {
    label: {value: "general data"},
    children: (
        <React.Fragment>
            <InputText icon={'perm_identity'} label={'Name'} value={'Manager'} maxLength={256} required/>
            <InputTextarea icon={'notes'} label={'Description'} value={'Here you will see the description of the group'} maxLength={1024}/>
            <InputFile label={'Icon'} icon={'photo'}/>
        </React.Fragment>
    )
}

export default {
    title: 'Organisms/FormSection',
    component: TemplateWithTheme,
}