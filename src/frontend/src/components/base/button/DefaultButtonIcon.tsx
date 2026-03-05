import React from 'react';
import {Button} from "@app_component/base/button/Button";
import {ButtonProps} from "@app_component/base/button/interfaces";

const DefaultButtonIcon = (props: ButtonProps) => {
    return <Button {...props} iconSize={'16px'}/>
}

export default DefaultButtonIcon;
