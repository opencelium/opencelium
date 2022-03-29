import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    ITemplate,
    ITemplateText,
} from "@interface/connection/ITemplate";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {RootState} from "@store/store";
import {TemplateState} from "@slice/connection/TemplateSlice";
import {IConnection} from "@interface/connection/IConnection";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {deleteTemplateById} from "@action/connection/TemplateCreators";


export class Template extends HookStateClass implements ITemplate{
    id: string;

    static reduxState?: TemplateState;

    @App.inputType
    name: string = '';

    @App.inputType
    description: string = '';

    version: string = '';

    link: string = '';

    connection: IConnection = null;

    constructor(template?: Partial<ITemplate> | null) {
        // @ts-ignore
        super(template?.validations || {});
        this.id = template?.id || template?.templateId || '';
        this.name = template?.name || '';
        this.description = template?.description || '';
        this.version = template?.version || '';
        this.link = template?.link || '';
        this.connection = template?.connection || null;
        // @ts-ignore
        this.dispatch = template.dispatch ? template.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<ITemplate>):T{
        return super.createState<ITemplate>(Template, (state: RootState) => state.templateReducer, args);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.templateReducer);
    }

    getText(data: IInput<ITemplateText, InputTextProps>):ReactElement{
        return super.getInputText<ITemplateText, InputTextProps>(data);
    }

    getTexts(data: IInput<ITemplateText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<ITemplateText, InputTextProps>(data);
    }

    @App.dispatch<ITemplate>(deleteTemplateById, {hasNoValidation: true})
    deleteById(){
        return this.validateId(this.id);
    }
}