import React, {InputHTMLAttributes} from "react";
import {InputElementProps} from "../interfaces";

export enum InputTextType {
    Text = "text",
    Password = "password",
    Number = "number",
}

interface InputTextProps extends InputHTMLAttributes<HTMLInputElement>, InputElementProps{
    type?: InputTextType,
    overflow?: string,
    paddingLeftInput?: string,
    paddingRightInput?: string,
    inputHeight?: string,
    isVisible?: boolean;
}


export {
    InputTextProps,
}