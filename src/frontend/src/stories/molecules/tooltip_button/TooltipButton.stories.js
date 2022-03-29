import React from 'react';
import {TooltipButton as TooltipButtonComponent} from "@molecule/tooltip_button/TooltipButton";
import {withTheme} from "styled-components";
import {ColorTheme} from "../../../components/general/Theme";

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