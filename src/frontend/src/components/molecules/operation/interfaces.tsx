import {Operation} from "@class/invoker/Operation";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {ResponseFormat} from "@interface/invoker/IBody";
import {ITheme} from "../../general/Theme";

interface DefaultProps{
    operationItem: Operation,
    updateOperation: (operation: Operation) => void,
}

interface NameProps extends DefaultProps, InputTextProps{

}

interface EndpointProps extends DefaultProps, InputTextProps{

}

interface StatusProps extends DefaultProps, InputTextProps{

}

interface DataProps extends DefaultProps, InputRadiosProps{

}


interface BodyProps{
    theme?: ITheme,
    updateBody: (body: any) => void,
    readOnly?: boolean,
    value: any,
    format: ResponseFormat,
}

interface HeaderProps{
    theme?: ITheme,
    updateHeader: (header: any) => void,
    readOnly?: boolean,
    value: any,
}

export {
    NameProps,
    EndpointProps,
    StatusProps,
    DataProps,
    BodyProps,
    HeaderProps,
}