/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

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