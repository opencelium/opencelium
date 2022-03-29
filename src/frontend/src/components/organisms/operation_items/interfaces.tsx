import {ITheme} from "../../general/Theme";
import {REQUEST_METHOD} from "@requestInterface/application/IRequest";
import {Operation} from "@class/invoker/Operation";

interface OperationItemsProps{
    theme?: ITheme,
    operations: Operation[],
    isReadonly?: boolean,
    updateOperations?: (operations: Operation[]) => void;
}

interface MethodTitleStyledProps{
    method?: REQUEST_METHOD,
}

export {
    OperationItemsProps,
    MethodTitleStyledProps,
}