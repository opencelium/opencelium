import React from 'react';
import {TextProps, TextSize} from "@app_component/base/text/interfaces";
import Text from './Text';
import {ColumnHeaderTextSize} from "@entity/application/utils/constants";

const ColumnHeaderText = (props: TextProps) => {
    return (
        <Text {...props} size={`${ColumnHeaderTextSize}px`}/>
    )
}

export default ColumnHeaderText;
