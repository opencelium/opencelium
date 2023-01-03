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
import {isArray, isEmptyObject, isString} from "@application/utils/utils";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import InputJsonView from "@app_component/base/input/json_view/InputJsonView";
import {InputElementProps} from "@app_component/base/input/interfaces";
import {IBody, IBodyRadios, IBodyText} from "../interfaces/IBody";
import {InvokerState} from "../redux_toolkit/slices/InvokerSlice";
import {DataType, ResponseFormat, ResponseType} from "../requests/models/Body";


export class Body extends HookStateClass implements IBody{
    nodeId: any;
    static reduxState?: InvokerState;

    @App.inputType
    format: ResponseFormat = ResponseFormat.Json;

    @App.inputType
    fields: any = {};

    type: ResponseType = ResponseType.Object;

    data: DataType = DataType.Raw;

    constructor(body?: Partial<IBody> | null) {
        // @ts-ignore
        super(body?.validations || {}, body?._readOnly);
        this.format = body?.format || ResponseFormat.Json;
        this.data = body?.data || DataType.Raw;
        this.type = body?.type || ResponseType.Object;
        this.fields = body?.fields || {};
        this.setType(this.type);
    }

    static createState<T>(args?: Partial<IBody>, observation?: any):T{
        return super.createState<IBody>(Body, (state: RootState) => state.invokerReducer, args,[{functionName: 'updateState', value: observation}]);
    }

    setType(type: ResponseType){
        this.type = type;
        switch (this.type){
            case ResponseType.Object:
                this.fields = isArray(this.fields) ? this.fields.length > 0 ? this.fields[0] : {} : this.fields;
                break;
            case ResponseType.Array:
                if(!isArray(this.fields)){
                    this.fields = [this.fields];
                }
                break;
        }
    }

    getText(data: IInput<IBodyText, InputTextProps>):ReactElement{
        return super.getInputText<IBodyText, InputTextProps>(data);
    }

    getRadios(data: IInput<IBodyRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IBodyRadios, InputRadiosProps>(data);
    }

    getFields(props?: InputElementProps): ReactElement{
        // @ts-ignore
        const updateJson = (json: any) => this[`updateFields`](this, isString(json) ? JSON.parse(json) : json)
        return <InputJsonView
            jsonViewProps={{
                name: 'body',
                collapsed: false,
                src: this.fields,
            }}
            updateJson={updateJson}
            icon={'data_object'}
            label={'Body'}
            {...props}
        />;
    }

    getObject(){
        return {
            type: this.type,
            format: this.format,
            data: this.data,
            fields: isEmptyObject(this.fields) ? null : this.fields,
        };
    }
}