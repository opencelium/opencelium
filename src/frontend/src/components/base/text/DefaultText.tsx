import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';
import {DefaultTextSize} from "@entity/application/utils/constants";

const DefaultText = (props: TextProps) => {
    return (
        <Text {...props} size={`${DefaultTextSize}px`}/>
    )
}

export default DefaultText;
