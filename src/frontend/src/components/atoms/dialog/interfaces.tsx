import {ITheme} from "../../general/Theme";

interface ActionProps{
    id: string,
    label: string,
    onClick: any,
    isLoading?: boolean,
    isDisabled?: boolean,
}

interface DialogThemeProps{
    modal?: string,
    content?: string,
    wrapper?: string,
    title?: string,
    dialog?: string,
}

interface DialogStylesProps{
    modal?: object,
    header?: object,
    body?: object,
}

interface DialogProps{
    theme?: ITheme,
    active: boolean,
    title: string,
    isConfirmation?: boolean,
    actions: ActionProps[],
    toggle: any,
    dialogClassname?: string,
    dialogTheme?: DialogThemeProps,
    styles?: DialogStylesProps,
}

export {
    ActionProps,
    DialogProps,
}