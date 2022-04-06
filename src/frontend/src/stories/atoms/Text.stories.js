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
import {Text as TextComponent} from "@atom/text/Text";
import {withTheme} from "styled-components";

const TemplateWithTheme = withTheme(TextComponent);

const Template = args => <TemplateWithTheme {...args}/>

export const Text = Template.bind({})
Text.args = {
    value: 'text'
}

export const TranslationText = Template.bind({})
TranslationText.args = {
    transKey: 'TEXT'
}

export default {
    title: 'Atoms/Text',
    component: TemplateWithTheme,
}