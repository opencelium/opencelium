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
import InputRadios from '@atom/input/radio/InputRadios';
import {ColorTheme} from "../../../components/general/Theme";


export default {
    title: 'Atoms/Input/Radios',
    component: InputRadios,
}

const Template = (args) => <InputRadios {...args}/>;

export const RadiosField = Template.bind(this);
RadiosField.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
}
export const ReadOnlyRadiosField = Template.bind(this);
ReadOnlyRadiosField.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    value: 'text field',
    readOnly: true,
}

export const LabelField = Template.bind(this);
LabelField.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    label: 'label',
    required: true,
}

export const InputWithIcon = Template.bind(this);
InputWithIcon.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person'
}
export const InputWithInsideIcon = Template.bind(this);
InputWithInsideIcon.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person',
    isIconInside: true,
}
export const InputWithError = Template.bind(this);
InputWithError.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    label: 'label',
    error: 'Label is a required field',
    maxLength: 16,
    required: true,
    icon: 'person',
    color: ColorTheme.Turquoise
}
export const InputWithLoading = Template.bind(this);
InputWithLoading.args = {
    options: [{label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    label: 'label',
    error: 'Label is a required field',
    maxLength: 16,
    required: true,
    icon: 'person',
    isLoading: true,
}