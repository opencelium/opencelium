import React from 'react';
import type {FieldContainerComponent} from "@shared/ui/primitives/FieldContainer/FieldContainer.types.ts";
import {theme} from "antd";

const AntFieldContainerAnt: FieldContainerComponent =
    ({
        children,
        isEmpty,
        ...props }) => {

    const { token } = theme.useToken();
    return (
        <div className="ant-input ant-input-affix-wrapper ant-input-outlined " {...props} style={{
            border: `1px ${isEmpty ? 'dotted' : 'solid'} ${token.colorBorder}`,
            borderRadius: token.borderRadius,
            padding: '4px',
            width: '100%',
            ...props.style,
        }}>
            {children}
        </div>
    )
};

export default AntFieldContainerAnt;
