import React, {ReactElement} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IOperation,
    IOperationText, OperationType,
} from "@interface/invoker/IOperation";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InvokerState} from "@slice/InvokerSlice";
import {RootState} from "@store/store";
import {IRequest} from "@interface/invoker/IRequest";
import {IResponse} from "@interface/invoker/IResponse";
import {Request} from "./Request";
import {Response} from "./Response";


export class Operation extends HookStateClass implements IOperation{
    static reduxState?: InvokerState;

    uniqueIndex: string;

    @App.inputType
    name: string = '';

    type: OperationType = '';

    @App.inputType
    request: IRequest = null;
    @App.inputType
    response: IResponse = null;

    constructor(operation?: Partial<IOperation> | null) {
        // @ts-ignore
        super(operation?.validations || {}, operation?._readOnly);
        this.uniqueIndex = operation?.uniqueIndex || `${new Date().getTime()}_${Math.floor(Math.random() * 100000)}`;
        this.name = operation?.name || '';
        this.type = operation?.type || '';
        this.request = new Request(operation?.request || null);
        this.response = new Response(operation?.response || null);
    }

    static createState<T>(args?: Partial<IOperation>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}, {functionName: 'request', value: args.request}, {functionName: 'response', value: args.response}];
        return super.createState<IOperation>(
            Operation,
            (state: RootState) => state.invokerReducer,
            args,
            observations);
    }

    getText(data: IInput<IOperationText, InputTextProps>):ReactElement{
        return super.getInputText<IOperationText, InputTextProps>(data);
    }

    getObject(){
        let obj = {
            name: this.name,
            type: this.type,
            request: this.request.getObject(),
            response: this.response.getObject(),
        };
        return obj;
    }
}