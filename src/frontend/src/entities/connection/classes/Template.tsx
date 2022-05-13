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
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {TemplateState} from "@entity/template/redux_toolkit/slices/TemplateSlice";
import {deleteTemplateById} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {
    ITemplate,
    ITemplateText,
} from "../interfaces/ITemplate";
import {IConnection} from "../interfaces/IConnection";
import ModelTemplate from "../requests/models/Template";


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

    @App.dispatch<ITemplate>(deleteTemplateById, {mapping: (template: ITemplate) => {return template.id}, hasNoValidation: true})
    deleteById(){
        return this.validateId(this.id);
    }

    getModel(): ModelTemplate{
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