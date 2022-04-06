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
import InputTextarea from '@atom/input/textarea/InputTextarea';


export default {
    title: 'Atoms/Input/Textarea',
    component: InputTextarea,
}

const Template = (args) => <InputTextarea {...args}/>;

export const TextareaField = Template.bind(this);
TextareaField.args = {
}

export const MaxLengthField = Template.bind(this);
MaxLengthField.args = {
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