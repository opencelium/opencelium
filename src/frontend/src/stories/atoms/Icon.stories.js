import React from 'react';
import Icon from "@atom/icon/Icon";

export default {
    title: 'Atoms/Icon',
    component: Icon,
}

const Template = args => <Icon {...args}/>

export const TurquoiseUser = Template.bind({})

TurquoiseUser.args = {
    name: 'person'
}

