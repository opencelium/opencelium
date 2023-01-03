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
import InputSelect from '@app_component/base/input/select/InputSelect';
import {ColorTheme} from "@style/Theme";


export default {
    title: 'Atoms/Input/Select',
    component: InputSelect,
}

const Template = (args) => <InputSelect {...args}/>;

export const SelectField = Template.bind(this);
SelectField.args = {
    value: 'test',
    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}]
}
export const ReadOnlyTextField = Template.bind(this);
ReadOnlyTextField.args = {

    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    value: 'text field',
    readOnly: true,
}

export const PlaceholderField = Template.bind(this);
PlaceholderField.args = {

    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    placeholder: 'placeholder...',
    required: true,
}

export const LabelField = Template.bind(this);
LabelField.args = {

    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    label: 'label',
    required: true,
}
export const InputWithIcon = Template.bind(this);
InputWithIcon.args = {

    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    label: 'label',
    required: true,
    icon: 'person'
}
export const InputWithInsideIcon = Template.bind(this);
InputWithInsideIcon.args = {
    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    label: 'label',
    required: true,
    icon: 'person',
    isIconInside: true,
}
export const InputWithError = Template.bind(this);
InputWithError.args = {

    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    label: 'label',
    error: 'Label is a required field',
    required: true,
    icon: 'person',
    color: ColorTheme.Turquoise
}
export const InputWithLoading = Template.bind(this);
InputWithLoading.args = {
    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    label: 'label',
    error: 'Label is a required field',
    required: true,
    icon: 'person',
    isLoading: true,
}
export const MultipleInput = Template.bind(this);
MultipleInput.args = {
    isMultiple: true,
    options: [{value: 2, label: 'mr'}, {value: 3, label: 'mrs'}],
    value: [2, 3],
    label: 'label',
    error: 'Label is a required field',
    required: true,
    icon: 'person',
    color: ColorTheme.Turquoise
}