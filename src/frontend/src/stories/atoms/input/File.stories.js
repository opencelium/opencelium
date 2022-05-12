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
import InputFile from '@app_component/base/input/file/InputFile';


export default {
    title: 'Atoms/Input/File',
    component: InputFile,
}

const Template = (args) => <InputFile {...args}/>;

export const FileField = Template.bind(this);
FileField.args = {}

export const PlaceholderField = Template.bind(this);
PlaceholderField.args = {
    placeholder: 'Another placeholder',
    required: true,
}

export const FileWithLabel = Template.bind(this);
FileWithLabel.args = {
    label: 'label',
    required: true,
}

export const FileWithIcon = Template.bind(this);
FileWithIcon.args = {
    label: 'label',
    required: true,
    icon: 'person'
}
export const FileWithInsideIcon = Template.bind(this);
FileWithInsideIcon.args = {
    label: 'label',
    required: true,
    icon: 'person',
    isIconInside: true,
}