import {ITheme} from "../../general/Theme";
import {IInvoker} from "@interface/invoker/IInvoker";

interface InvokerGeneralDataProps{
    theme?: ITheme,
    invoker?: IInvoker,
    isAdd?: boolean,
}

export {
    InvokerGeneralDataProps,
}