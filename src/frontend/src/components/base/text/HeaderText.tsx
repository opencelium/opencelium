import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';
import {HeaderTextSize} from "@entity/application/utils/constants";

const HeaderText = (props: TextProps) => {
    return (
        <Text {...props} size={`${HeaderTextSize}px`}/>
    )
}

export default HeaderText;
