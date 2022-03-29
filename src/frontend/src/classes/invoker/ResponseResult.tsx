import React, {ReactElement} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IResponseResult, IResponseResultText,
} from "@interface/invoker/IResponseResult";
import {InvokerState} from "@slice/InvokerSlice";
import {RootState} from "@store/store";
import {IBody} from "@interface/invoker/IBody";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import { Body } from "./Body";


export class ResponseResult extends HookStateClass implements IResponseResult{
    static reduxState?: InvokerState;

    @App.inputType
    status: string = '';

    @App.inputType
    header: any = null;

    @App.inputType
    body: IBody = null;

    constructor(response?: Partial<IResponseResult> | null) {
        // @ts-ignore
        super(response?.validations || {}, response?._readOnly);
        this.status = response?.status || '';
        this.header = response?.header || null;
        this.body = response?.body instanceof Body ? response.body : new Body(response?.body || null);
    }

    static createState<T>(args?: Partial<IResponseResult>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}, {functionName: 'body', value: args.body}];
        return super.createState<IResponseResult>(
            ResponseResult,
            (state: RootState) => state.invokerReducer,
            args,
            observations);
    }

    getText(data: IInput<IResponseResultText, InputTextProps>):ReactElement{
        return super.getInputText<IResponseResultText, InputTextProps>(data);
    }
    getObject(params = {bodyOnlyConvert: false}){
        let obj: any = {
            status: this.status,
            body: this.body.getObject(),
            header: this.header,
        };
        return obj;
    }
}