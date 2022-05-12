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
import {Label as LabelComponent} from "@molecule/../../../components/form/form_section/label/Label";
import {withTheme} from "styled-components";

const TemplateWithTheme = withTheme(LabelComponent);

const Template = args => <TemplateWithTheme {...args}/>

export const Label = Template.bind({})
Label.args = {
    value: 'user details'
}
export default {
    title: 'Molecules/FormSection/Label',
    component: TemplateWithTheme,
}