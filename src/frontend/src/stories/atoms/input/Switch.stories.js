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
import InputSwitch from '@app_component/base/input/switch/InputSwitch';
import {ColorTheme} from "@style/Theme";


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