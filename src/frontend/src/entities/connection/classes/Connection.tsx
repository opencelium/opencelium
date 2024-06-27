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

import React, {ReactElement, ReactNode} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {InputSelectProps, OptionProps} from "@app_component/base/input/select/interfaces";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {
    IConnection,
    IConnectionSelect,
    IConnectionText,
    IConnectionTextarea
} from "../interfaces/IConnection";
import {ConnectionState} from "../redux_toolkit/slices/ConnectionSlice";
import {addConnection, deleteConnectionById} from "../redux_toolkit/action_creators/ConnectionCreators";


export class Connection extends HookStateClass implements IConnection{
    id: number;

    static reduxState?: ConnectionState;

    @App.inputType
    title: string = '';

    @App.inputType
    description: string = '';

    @App.inputType
    fromConnector: OptionProps;

    @App.inputType
    toConnector: OptionProps;

    @App.inputType
    categoryId: OptionProps;

    mode: any;

    fieldBinding: any;


    constructor(connection?: Partial<IConnection> | null) {
        // @ts-ignore
        super(connection?.validations || {}, connection?._readOnly, connection?.wholeInstance);
        this.id = connection?.id || connection?.connectionId || 0;
        this.title = connection?.title || '';
        this.description = connection?.description || '';
        this.fromConnector = connection?.fromConnector || null;
        this.toConnector = connection?.toConnector || null;
        this.categoryId = connection?.categoryId || null;
        // @ts-ignore
        this.dispatch = connection.dispatch ? connection.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<IConnection>):T{
        return super.createState<IConnection>(Connection, (state: RootState) => state.connectionReducer, args);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.connectionReducer);
    }

    getText(data: IInput<IConnectionText, InputTextProps>):ReactElement{
        return super.getInputText<IConnectionText, InputTextProps>(data);
    }

    getTexts(data: IInput<IConnectionText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IConnectionText, InputTextProps>(data);
    }

    getSelect(data: IInput<IConnectionSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<IConnectionSelect, InputSelectProps>(data);
    }

    getTextarea(data: IInput<IConnectionTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IConnectionTextarea, InputTextareaProps>(data);
    }

    @App.dispatch(addConnection)
    add(): boolean{
        return true;
    }

    @App.dispatch<IConnection>(deleteConnectionById, {mapping: (connection: IConnection) => {return connection.id;}, hasNoValidation: true})
    deleteById(){
        return this.validateId(this.id);
    }
}