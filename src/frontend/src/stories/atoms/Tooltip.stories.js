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