import React from 'react';
import {Label as LabelComponent} from "@molecule/form_section/label/Label";
import {withTheme} from "styled-components";

const TemplateWithTheme = withTheme(LabelComponent);

const Template = args => <TemplateWithTheme {...args}/>

export const Label = Template.bind({})
Label.args = {
    value: 'user details'
}
export default {
    title: 'Molecules/FormSection/Label',
    component: TemplateWithTheme,
}