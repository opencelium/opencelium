import {Operation} from "@class/invoker/Operation";
import {ITheme} from "../../general/Theme";

interface OperationItemProps{
    theme?: ITheme,
    operationItem?: Operation,
    isReadonly?: boolean,
    updateOperation?: any,
}

export {
    OperationItemProps,
}