import {ITheme} from "../../general/Theme";
import {MultipleTitleProps} from "@interface/application/IListCollection";
import React from "react";

interface TitleStyledProps{

}

interface ActionsStyledProps{

}

interface FormStyledProps{
    margin?: string | number,
    padding?: string | number,
}

interface FormSectionStyledProps{
    additionalStyles?: string,
}

interface FormProps{
    theme?: ITheme,
    title?: string | MultipleTitleProps[] | React.ReactNode,
    formSections?: any,
    actions?: any[],
    isLoading?: boolean,
}

export {
    TitleStyledProps,
    ActionsStyledProps,
    FormStyledProps,
    FormSectionStyledProps,
    FormProps,
}