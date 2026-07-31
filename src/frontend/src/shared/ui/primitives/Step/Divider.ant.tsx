import React from 'react';
import {Divider} from "antd";
import type {DividerComponent} from "@shared/ui/primitives/Divider/Divider.types.tsx";

const AntDivider: DividerComponent =
    ({
        placement,
         children,
    }) => {

        return (
            <Divider titlePlacement={placement}>
                {children}
            </Divider>
        )
    };

export default AntDivider;
