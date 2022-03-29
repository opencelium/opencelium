import React, {InputHTMLAttributes} from "react";
import {ElementProps, InputElementProps} from "../interfaces";


interface InputFileProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value">, Omit<InputElementProps, "value">{
    value?: readonly string[],
    hasNoImage?: boolean,
    onToggleHasImage?: (hasImage: boolean) => void,
    hasCheckbox?: boolean,
    hasCrop?: boolean,
}

interface InputProps extends ElementProps{
}

interface TextStyledProps extends ElementProps{
    hasBorder?: boolean,
    hasCheckbox?: boolean,
}

interface ButtonStyledProps extends ElementProps{
    hasCheckbox?: boolean,
}


export {
    InputProps,
    InputFileProps,
    TextStyledProps,
    ButtonStyledProps,
}