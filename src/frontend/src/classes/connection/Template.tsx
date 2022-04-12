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
import ModelTemplate from "@model/connection/Template";


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

    getModel(isForApiRequest: boolean = false): ModelTemplate{
        let mappedTemplate: ModelTemplate = {
            name: this.name,
            description: this.description,
            version: this.version,
            connection: this.connection,
        };
        if(this.id !== ''){
            return {
                templateId: this.id,
                ...mappedTemplate,
            }
        }
        return mappedTemplate;
    }
}