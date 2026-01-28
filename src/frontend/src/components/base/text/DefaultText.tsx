import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';

const DefaultText = (props: TextProps) => {
    return (
        <Text {...props}/>
    )
}

export default DefaultText;
