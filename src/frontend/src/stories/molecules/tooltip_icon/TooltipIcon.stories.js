import React from 'react';
import {TooltipIcon as TooltipIconComponent} from "@molecule/tooltip_icon/TooltipIcon";
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