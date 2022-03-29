import React from 'react';
import InputFile from '@atom/input/file/InputFile';


export default {
    title: 'Atoms/Input/File',
    component: InputFile,
}

const Template = (args) => <InputFile {...args}/>;

export const FileField = Template.bind(this);
FileField.args = {}

export const PlaceholderField = Template.bind(this);
PlaceholderField.args = {
    placeholder: 'Another placeholder',
    required: true,
}

export const FileWithLabel = Template.bind(this);
FileWithLabel.args = {
    label: 'label',
    required: true,
}

export const FileWithIcon = Template.bind(this);
FileWithIcon.args = {
    label: 'label',
    required: true,
    icon: 'person'
}
export const FileWithInsideIcon = Template.bind(this);
FileWithInsideIcon.args = {
    label: 'label',
    required: true,
    icon: 'person',
    isIconInside: true,
}