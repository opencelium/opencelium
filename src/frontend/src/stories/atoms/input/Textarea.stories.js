import React from 'react';
import InputTextarea from '@atom/input/textarea/InputTextarea';


export default {
    title: 'Atoms/Input/Textarea',
    component: InputTextarea,
}

const Template = (args) => <InputTextarea {...args}/>;

export const TextareaField = Template.bind(this);
TextareaField.args = {
}

export const MaxLengthField = Template.bind(this);
MaxLengthField.args = {
    maxLength: 16,
}

export const PlaceholderField = Template.bind(this);
PlaceholderField.args = {
    placeholder: 'placeholder...',
    required: true,
}

export const LabelField = Template.bind(this);
LabelField.args = {
    label: 'label',
    required: true,
}

export const LabelWithMaxLengthField = Template.bind(this);
LabelWithMaxLengthField.args = {
    label: 'label',
    maxLength: 16,
    required: true,
}
export const InputWithIcon = Template.bind(this);
InputWithIcon.args = {
    label: 'label',
    maxLength: 16,
    required: true,
    icon: 'person'
}