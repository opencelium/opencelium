import React from 'react';
import InputText from '@atom/input/text/InputText';
import {InputTextType} from "@atom/input/text/interfaces";
import {ColorTheme} from "../../../components/general/Theme";


export default {
    title: 'Atoms/Input/Text',
    component: InputText,
}

const Template = (args) => <InputText {...args}/>;

export const TextField = Template.bind(this);
TextField.args = {
}
export const ReadOnlyTextField = Template.bind(this);
ReadOnlyTextField.args = {
    value: 'text field',
    readOnly: true,
}

export const PasswordField = Template.bind(this);
PasswordField.args = {
    value: 'password',
    type: InputTextType.Password,
}

export const MaxLengthField = Template.bind(this);
MaxLengthField.args = {
    value: 'max length 16',
    maxLength: 16,
}

export const PlaceholderField = Template.bind(this);
PlaceholderField.args = {
    placeholder: 'placeholder...',
    required: true,
}

export const LabelField = Template.bind(this);
LabelField.args = {
    label: 'label',
    required: true,
}

export const LabelWithMaxLengthField = Template.bind(this);
LabelWithMaxLengthField.args = {
    label: 'label',
    maxLength: 16,
    required: true,
}
export const InputWithIcon = Template.bind(this);
InputWithIcon.args = {
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person'
}
export const InputWithOutsideIcon = Template.bind(this);
InputWithOutsideIcon.args = {
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person',
    isIconInside: false,
}
export const InputWithError = Template.bind(this);
InputWithError.args = {
    label: 'label',
    error: 'Label is a required field',
    maxLength: 16,
    required: true,
    icon: 'person',
    color: ColorTheme.Turquoise
}
export const InputWithLoading = Template.bind(this);
InputWithLoading.args = {
    label: 'label',
    error: 'Label is a required field',
    maxLength: 16,
    required: true,
    icon: 'person',
    isLoading: true,
}