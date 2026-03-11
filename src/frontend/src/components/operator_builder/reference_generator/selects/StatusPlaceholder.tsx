import React from 'react';
import {Text} from "@app_component/base/text/Text";
import {DefaultInputTextSize} from "@entity/application/utils/constants";

const StatusPlaceholder = () => (
    <div style={{
        lineHeight: '36px',
        borderBottom: '1px solid #cccccc',
    }}><Text value={'Response Status'} size={`${DefaultInputTextSize}px`}/></div>
);

export default StatusPlaceholder;
