import React from 'react';
import Icon from "@atom/icon/Icon";
import {MenuIconStyled} from "./styles";
import {IconProps} from "@atom/icon/interfaces";
import {TooltipProps} from "reactstrap";
import Tooltip from "@atom/tooltip/Tooltip";

export const MenuIcon = (props: IconProps & Partial<TooltipProps>) => {
    if(props.tooltip){
        let id = `menu_icon_${props.name}`;
        return(
            <Tooltip target={id} tooltip={props.tooltip} component={
                <MenuIconStyled size={props.size}>
                    <Icon id={id} {...props}/>
                </MenuIconStyled>
            }/>
        );
    } else{
        return(
            <MenuIconStyled size={props.size}>
                <Icon {...props}/>
            </MenuIconStyled>
        );
    }
}

export default MenuIcon;