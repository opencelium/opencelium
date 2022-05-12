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

import React, {ReactElement} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {RootState} from "@application/utils/store";
import {IInput} from "@application/interfaces/core";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {
    IResponseResult, IResponseResultText,
} from "../interfaces/IResponseResult";
import {InvokerState} from "../redux_toolkit/slices/InvokerSlice";
import {IBody} from "../interfaces/IBody";
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