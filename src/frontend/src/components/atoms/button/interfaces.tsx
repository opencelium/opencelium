import {ITheme} from "../../general/Theme";
import {PermissionProps} from "@constants/permissions";

interface ButtonStyledProps{
    width?: string,
    size?: string | number,
    float?: string,
    position?: string,
    right?: number,
    bottom?: number,
    top?: string | number,
    padding?: string | number,
    margin?: string | number,
    hasBackground: boolean,
    background: string,
    isContentCentralized: boolean,
    hasLabel?: boolean,
    isDisabled?: boolean,
    iconSize?: string,
}

interface SpinnerStyledProps{
    size: string | number,
    color: string,
    position: string,
    left?: string | number,
    top?: string | number,
}

interface LabelStyledProps{
    opacity: number,
    size: string,
    color: string,
    hasBackground: boolean,
    hasIcon?: boolean,
}

interface ButtonProps {
    id?: string,
    autoFocus?: boolean,
    hasConfirmation?: boolean,
    confirmationText?: string,
    href?: string,
    color?: string,
    background?: string,
    icon?: string,
    label?: string,
    size?: string | number,
    iconSize?: string,
    isDisabled?: boolean,
    isLoading?: boolean,
    hasBackground?: boolean,
    handleClick?: (e?: any) => void,
    onBlur?: (e: any) => void,
    theme?: ITheme,
    position?: string,
    right?: number,
    top?: number | string,
    padding?: number | string,
    margin?: string | number,
    bottom?: number,
    float?: string,
    permission?: PermissionProps,
    className?: string,
}


export {
    ButtonStyledProps,
    SpinnerStyledProps,
    LabelStyledProps,
    ButtonProps,
}