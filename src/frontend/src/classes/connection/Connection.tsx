import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IConnection,
    IConnectionSelect,
    IConnectionText,
    IConnectionTextarea
} from "@interface/connection/IConnection";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {RootState} from "@store/store";
import {ConnectionState} from "@slice/connection/ConnectionSlice";
import {addConnection, deleteConnectionById} from "@action/connection/ConnectionCreators";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";


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

    mode: any;

    fieldBinding: any;


    constructor(connection?: Partial<IConnection> | null) {
        // @ts-ignore
        super(connection?.validations || {});
        this.id = connection?.id || connection?.connectionId || 0;
        this.title = connection?.title || '';
        this.description = connection?.description || '';
        this.fromConnector = connection?.fromConnector || null;
        this.toConnector = connection?.toConnector || null;
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

    getTexts(data: IInput<IConnectionText, InputTextProps>[]):ReactNodeArray{
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

    @App.dispatch<IConnection>(deleteConnectionById, {hasNoValidation: true})
    deleteById(){
        return this.validateId(this.id);
    }
}