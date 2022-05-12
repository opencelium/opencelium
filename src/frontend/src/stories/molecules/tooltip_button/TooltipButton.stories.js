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
import {TooltipButton as TooltipButtonComponent} from "@molecule/../../../components/atoms/tooltip_button/TooltipButton";
import {withTheme} from "styled-components";
import {ColorTheme} from "@style/Theme";

const TemplateWithTheme = withTheme(TooltipButtonComponent);

const Template = args => <TemplateWithTheme {...args}/>

export const TooltipButtonStories = Template.bind({})
TooltipButtonStories.args = {
    color: ColorTheme.Black,
    icon: 'close',
    id: 'notification_delete_button_1',
    target: 'notification_delete_button_1',
    hasBackground: false,
    size: 16,
    value: 'delete',
    tooltip: 'Clear',
};
export default {
    title: 'Molecules/TooltipButton',
    component: TemplateWithTheme,
}