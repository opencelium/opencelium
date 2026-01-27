import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';

const ColumnHeaderText = (props: TextProps) => {
    return (
        <Text {...props} size={TextSize.Size_14}/>
    )
}

export default ColumnHeaderText;
