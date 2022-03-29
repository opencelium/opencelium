import {ReactJsonViewProps} from "react-json-view";
import {InputElementProps} from "@atom/input/interfaces";
import {ITheme} from "../../../general/Theme";

interface InputJsonViewProps extends InputElementProps{
    theme?: ITheme,
    jsonViewProps: ReactJsonViewProps,
    updateJson: (body: any) => void,
    hasEdit?: boolean,
}

interface EditButtonProps{
    theme?: ITheme,
    editJson: (body: any) => void,
    readOnly?: boolean,
    jsonValue: any,
}

export {
    InputJsonViewProps,
    EditButtonProps,
}