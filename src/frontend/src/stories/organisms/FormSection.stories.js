import React from 'react';
import {FormSection as FormSectionComponent} from "@organism/form_section/FormSection";
import {withTheme} from "styled-components";
import InputText from "@atom/input/text/InputText";
import InputTextarea from "@atom/input/textarea/InputTextarea";
import InputRadios from "@atom/input/radio/InputRadios";
import InputFile from "@atom/input/file/InputFile";
import {InputTextType} from "@atom/input/text/interfaces";
import InputSelect from "@atom/input/select/InputSelect";

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