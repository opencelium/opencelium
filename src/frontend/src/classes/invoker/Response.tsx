import React from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IResponse,
} from "@interface/invoker/IResponse";
import {InvokerState} from "@slice/InvokerSlice";
import {RootState} from "@store/store";
import {IResponseResult} from "@interface/invoker/IResponseResult";
import {IOperation} from "@interface/invoker/IOperation";
import {ResponseResult} from "./ResponseResult";


export class Response extends HookStateClass implements IResponse{
    static reduxState?: InvokerState;

    @App.inputType
    success: IResponseResult = null;

    @App.inputType
    fail: IResponseResult = null;

    constructor(request?: Partial<IResponse> | null) {
        // @ts-ignore
        super(request?.validations || {}, request?._readOnly);
        this.success = request?.success instanceof ResponseResult ? request.success : new ResponseResult(request?.success || null);
        this.fail =request?.success instanceof ResponseResult ? request.fail : new ResponseResult(request?.fail || null);
    }

    static createState<T>(args?: Partial<IResponse>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}, {functionName: 'success', value: args.success}, {functionName: 'fail', value: args.fail}];
        return super.createState<IOperation>(
            Response,
            (state: RootState) => state.invokerReducer,
            args,
            observations);
    }

    getObject(){
        let obj = {
            success: this.success.getObject(),
            fail: this.fail.getObject(),
        };
        return obj;
    }
}