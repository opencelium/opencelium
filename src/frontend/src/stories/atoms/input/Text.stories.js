/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import InputText from '@app_component/base/input/text/InputText';
import {InputTextType} from "@app_component/base/input/text/interfaces";
import {ColorTheme} from "@style/Theme";


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