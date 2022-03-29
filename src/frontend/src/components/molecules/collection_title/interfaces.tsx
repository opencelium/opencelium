import {ITheme} from "../../general/Theme";
import React from "react";
import {MultipleTitleProps} from "@interface/application/IListCollection";

interface TitleProps{
    theme?: ITheme,
    title: string | MultipleTitleProps[] | React.ReactNode,
    className?: string,
    icon?: any,
}

export {
    TitleProps,
}