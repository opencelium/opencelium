/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {ReactElement} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import { REQUEST_METHOD } from "@application/requests/interfaces/IApplication";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {
    IRequest, IRequestRadios, IRequestText
} from "../interfaces/IRequest";
import {InvokerState} from "../redux_toolkit/slices/InvokerSlice";
import {Body} from "./Body";
import {IBody} from "../interfaces/IBody";


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