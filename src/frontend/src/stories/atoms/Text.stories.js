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