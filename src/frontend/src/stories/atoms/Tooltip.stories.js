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
import Tooltip from "@atom/tooltip/Tooltip";
import Icon from "@atom/icon/Icon";
import {withTheme} from "styled-components";
import {Button} from "@atom/button/Button";
import {ColorTheme} from "../../components/general/Theme";

export default {
    title: 'Atoms/Tooltip',
    component: Tooltip,
}

const Template = args => <Tooltip {...args}/>

export const IconTooltip = Template.bind({})
IconTooltip.args = {
    tooltip: 'Icon Element',
    position: 'auto',
    target: 'icon',
    component: <Icon name={'person'} id={'icon'} isButton/>,
}

export const SpanTooltip = Template.bind({})
SpanTooltip.args = {
    tooltip: 'Span Element',
    position: 'bottom',
    target: 'span',
    component: <span id={'span'}>{`{...}`}</span>,
}

export const ButtonOnlyIconTooltip = Template.bind({})

const TemplateWithTheme = withTheme(Button);
ButtonOnlyIconTooltip.args = {
    tooltip: 'Button with Icon',
    position: 'bottom',
    target: 'button',
    component: <TemplateWithTheme id={'button'} icon={'face'} hasBackground={false} color={ColorTheme.Black} onClick={() => {console.log('Pressed!')}}/>,
}