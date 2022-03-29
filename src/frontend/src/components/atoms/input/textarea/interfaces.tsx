import React, {InputHTMLAttributes} from "react";
import {InputElementProps} from "../interfaces";


interface InputTextareaProps extends InputHTMLAttributes<HTMLTextAreaElement>, InputElementProps{
    rows?: number,
}


export {
    InputTextareaProps,
}