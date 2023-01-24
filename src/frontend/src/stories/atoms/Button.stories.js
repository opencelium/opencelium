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
import {Button} from "@app_component/base/button/Button";
import {withTheme} from "styled-components";
import {ColorTheme} from "@style/Theme";

const TemplateWithTheme = withTheme(Button);

const Template = args => <TemplateWithTheme {...args}/>


export const LabelAndIcon = Template.bind({})
LabelAndIcon.args = {
    label: 'Add Connector',
    icon: 'add',
}

export const OnlyLabel = Template.bind({})
OnlyLabel.args = {
    label: 'Expert',
}

export const OnlyIconWithBackground = Template.bind({})
OnlyIconWithBackground.args = {
    icon: 'add',
}

export const OnlyIcon = Template.bind({})
OnlyIcon.args = {
    label: '',
    icon: 'face',
    hasBackground: false,
    color: ColorTheme.Black,
    handleClick: () => {console.log('Only Icon')},
}


export default {
    title: 'Atoms/Button',
    component: TemplateWithTheme,
    argTypes: { handleClick: { action: 'clicked' } },
}