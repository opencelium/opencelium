import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';

const HeaderText = (props: TextProps) => {
    return (
        <Text {...props} size={TextSize.Size_24}/>
    )
}

export default HeaderText;
