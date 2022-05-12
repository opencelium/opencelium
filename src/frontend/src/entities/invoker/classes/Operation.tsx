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
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {
    IOperation,
    IOperationText, OperationType,
} from "../interfaces/IOperation";
import {InvokerState} from "../redux_toolkit/slices/InvokerSlice";
import {IRequest} from "../interfaces/IRequest";
import {IResponse} from "../interfaces/IResponse";
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