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
import {TooltipIcon as TooltipIconComponent} from "@molecule/../../../components/atoms/tooltip_icon/TooltipIcon";
import {withTheme} from "styled-components";

const TemplateWithTheme = withTheme(TooltipIconComponent);

const Template = args => <TemplateWithTheme {...args}/>

export const TooltipIconStories = Template.bind({})
TooltipIconStories.args = {
    target: 'notification_delete_button_1',
    size: 16,
    name: 'delete',
    tooltip: 'Clear',
};
export default {
    title: 'Molecules/TooltipIcon',
    component: TemplateWithTheme,
}