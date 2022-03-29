import React, {FC} from 'react';
import Tooltip from "@atom/tooltip/Tooltip";
import {TooltipProps} from "reactstrap";
import {TooltipButtonProps} from "./interfaces";
import {withTheme} from "styled-components";
import Button from "@atom/button/Button";
import {ButtonProps} from "@atom/button/interfaces";

const TooltipButton: FC<TooltipButtonProps & ButtonProps & Partial<TooltipProps>> =
    ({
         tooltip,
         position,
         target,
         component,
         ...buttonProps
     }) => {
        return (
            <Tooltip target={target.toString()} tooltip={tooltip} position={position} component={
                <Button id={target.toString()} {...buttonProps}/>}
            />
        )
    }

TooltipButton.defaultProps = {
}


export {
    TooltipButton,
};

export default withTheme(TooltipButton);