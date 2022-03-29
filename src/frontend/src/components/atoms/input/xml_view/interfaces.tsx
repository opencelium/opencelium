import {InputElementProps} from "@atom/input/interfaces";
import {ITheme} from "../../../general/Theme";
import React from "react";

interface InputXmlViewProps extends InputElementProps{
    theme?: ITheme,
    xmlViewProps:{
        translate: any,
        xml: any,
        afterUpdateCallback: any,
        readOnly?: boolean,
    }
}

export {
    InputXmlViewProps,
}