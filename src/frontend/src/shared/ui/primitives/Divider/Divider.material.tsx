import React from 'react';
import {Divider} from "@mui/material";
import type {DividerComponent} from "@shared/ui/primitives/Divider/Divider.types.tsx";

const MaterialDivider: DividerComponent =
    ({
         placement,
         children,
     }) => {

        return (
            <Divider textAlign={placement}>
                {children}
            </Divider>
        )
    };

export default MaterialDivider;
