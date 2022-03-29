import React from 'react';
import InputSwitch from '@atom/input/switch/InputSwitch';
import {ColorTheme} from "../../../components/general/Theme";


export default {
    title: 'Atoms/Input/Switch',
    component: InputSwitch,
}

const Template = (args) => <InputSwitch {...args}/>;

export const SwitchField = Template.bind(this);
SwitchField.args = {
    isChecked: false,
}
export const ReadOnlySwitchField = Template.bind(this);
ReadOnlySwitchField.args = {
    isChecked: true,
    readOnly: true,
    name: 'Test'
}

export const LabelField = Template.bind(this);
LabelField.args = {
    label: 'label',
    required: true,
    name: 'Test'
}

export const InputWithIcon = Template.bind(this);
InputWithIcon.args = {
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person',
    name: 'Test'
}
export const InputWithInsideIcon = Template.bind(this);
InputWithInsideIcon.args = {
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person',
    isIconInside: true,
    name: 'Test'
}
export const InputWithError = Template.bind(this);
InputWithError.args = {
    label: 'label',
    error: 'Label is a required field',
    maxLength: 16,
    required: true,
    icon: 'person',
    color: ColorTheme.Turquoise,
    name: 'Test'
}
export const InputWithLoading = Template.bind(this);
InputWithLoading.args = {
    label: 'label',
    error: 'Label is a required field',
    maxLength: 16,
    required: true,
    icon: 'person',
    isLoading: true,
    name: 'Test'
}