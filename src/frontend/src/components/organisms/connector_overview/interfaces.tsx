import {IConnector} from "@interface/connector/IConnector";
import {ITheme} from "../../general/Theme";

interface InvokerDetailsStyledProps{
    hasIcon?: boolean,
}

interface GeneralProps{
    theme?: ITheme,
    connector: IConnector,
}
interface HintProps{
    theme?: ITheme,
    connector?: IConnector,
}
interface InvokerProps{
    theme?: ITheme,
    connector?: IConnector,
}
interface OperationsProps{
    theme?: ITheme,
    connector?: IConnector,
}

export {
    InvokerDetailsStyledProps,
    GeneralProps,
    HintProps,
    InvokerProps,
    OperationsProps,
}