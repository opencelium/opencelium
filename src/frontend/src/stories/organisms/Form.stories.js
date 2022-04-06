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
import {Form as FormComponent} from "@organism/form/Form";
import {withTheme} from "styled-components";
import InputText from "@atom/input/text/InputText";
import InputTextarea from "@atom/input/textarea/InputTextarea";
import InputRadios from "@atom/input/radio/InputRadios";
import InputFile from "@atom/input/file/InputFile";
import {InputTextType} from "@atom/input/text/interfaces";
import InputSelect from "@atom/input/select/InputSelect";
import FormSection from "@organism/form_section/FormSection";
import Button from "@atom/button/Button";

const TemplateWithTheme = withTheme(FormComponent);

const Template = args => <TemplateWithTheme {...args}/>


export const FormUser = Template.bind({})
FormUser.args = {
    title: 'Add User',
    actions: [
        <Button label={'Add User'} icon={'add'} size={'1rem'}/>,
        <Button label={'Delete Selected'} icon={'delete'} size={'1rem'}/>,
        <InputText display={'inline-block'} placeholder={'Search field'}/>
        ],
    formSections: [
        <FormSection label={{value: 'user details'}}>
            <InputRadios icon={<span/>} label={'Title'} value={'mr'} options={[{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}]}/>
            <InputText icon={'perm_identity'} label={'Name'} value={'John'} required maxLength={128}/>
            <InputText icon={'perm_identity'} label={'Surname'} value={'Snow'} required maxLength={128}/>
            <InputText icon={'phone'} label={'Phone Number'} value={'+49745454544'} required/>
            <InputText icon={'people'} label={'Department'} value={'Sales'} required/>
            <InputText icon={'domain'} label={'Organization'} value={'Becon'} required/>
            <InputFile label={'Avatar'} icon={'photo'}/>
        </FormSection>,<React.Fragment>
            <FormSection label={{value: 'credentials'}}>
                <InputText icon={'email'} label={'Email'} value={'admin@opencelium.io'} required maxLength={255}/>
                <InputText icon={'vpn_key'} label={'Password'} value={'1111111111'} required type={InputTextType.Password} maxLength={16}/>
                <InputText icon={'vpn_key'} label={'Repeat Password'} value={'1111111111'} required type={InputTextType.Password} maxLength={16}/>
            </FormSection>
        <FormSection label={{value: 'user group'}}>
            <InputSelect icon={'supervised_user_circle'} label={'User Group'} options={[
                {value: 'admin', label: 'Admin'},
                {value: 'user', label: 'User'},
            ]} required/>
            <InputTextarea icon={'notes'} label={'Description'} value={'Here you will see the description of the role'} readOnly/>
        </FormSection></React.Fragment>
    ]
}

export default {
    title: 'Organisms/Form',
    component: TemplateWithTheme,
}