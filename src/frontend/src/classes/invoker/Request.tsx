import React, {ReactElement} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IRequest, IRequestRadios, IRequestText
} from "@interface/invoker/IRequest";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InvokerState} from "@slice/InvokerSlice";
import {RootState} from "@store/store";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {Body} from "./Body";
import {IBody} from "@interface/invoker/IBody";
import {REQUEST_METHOD} from "@requestInterface/application/IRequest";


export class Request extends HookStateClass implements IRequest{
    static reduxState?: InvokerState;

    @App.inputType
    endpoint: string = '';

    @App.inputType
    method: REQUEST_METHOD = null;

    @App.inputType
    header?: any = null;

    @App.inputType
    body: IBody = null;

    constructor(request?: Partial<IRequest> | null) {
        // @ts-ignore
        super(request?.validations || {}, request?._readOnly);
        this.endpoint = request?.endpoint || '';
        this.method = request?.method || null;
        this.header = request?.header || null;
        this.body = request?.body instanceof Body ? request.body : new Body(request?.body || null);
    }

    static createState<T>(args?: Partial<IRequest>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}, {functionName: 'body', value: args.body}];
        return super.createState<IRequest>(
            Request,
            (state: RootState) => state.invokerReducer,
            args,
            observations
        );
    }

    getText(data: IInput<IRequestText, InputTextProps>):ReactElement{
        return super.getInputText<IRequestText, InputTextProps>(data);
    }

    getRadios(data: IInput<IRequestRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IRequestRadios, InputRadiosProps>(data);
    }

    getObject(){
        let obj: any = {
            endpoint: this.endpoint,
            body: this.body.getObject(),
            method: this.method,
            header: this.header,
        };
        return obj;
    }
}