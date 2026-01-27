import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';

const DefaultText = (props: TextProps) => {
    return (
        <Text {...props} size={TextSize.Size_12}/>
    )
}

export default DefaultText;
