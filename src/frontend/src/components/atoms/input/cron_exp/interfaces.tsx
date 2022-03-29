import React, {InputHTMLAttributes} from "react";
import {InputElementProps} from "../interfaces";
import {InputSelectProps} from "@atom/input/select/interfaces";

interface CronExpInputProps extends InputHTMLAttributes<HTMLInputElement>, InputElementProps{
    overflow?: string,
    paddingLeftInput?: string,
    paddingRightInput?: string,
    inputHeight?: string,
    isVisible?: boolean;
}

interface CronSuffixStyledProps extends HTMLSpanElement{
    dayShow?: boolean,
}

interface SelectProps extends InputSelectProps{
    isForWeek: boolean,
    dayShow: boolean,
}


export {
    CronExpInputProps,
    CronSuffixStyledProps,
    SelectProps,
}