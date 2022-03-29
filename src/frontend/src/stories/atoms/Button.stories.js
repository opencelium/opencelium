import React from 'react';
import {Button} from "@atom/button/Button";
import {withTheme} from "styled-components";
import {ColorTheme} from "../../components/general/Theme";

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