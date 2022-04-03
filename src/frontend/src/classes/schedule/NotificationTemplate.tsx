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
    INotificationTemplate,
    INotificationTemplateFile,
    INotificationTemplateSelect,
    INotificationTemplateText,
    INotificationTemplateTextarea
} from "@interface/schedule/INotificationTemplate";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {RootState} from "@store/store";
import {NotificationTemplateState} from "@slice/schedule/NotificationTemplateSlice";
import {
    addNotificationTemplate, deleteNotificationTemplateById,
    getNotificationTemplateById,
    updateNotificationTemplate
} from "@action/schedule/NotificationTemplateCreators";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {Content} from "./Content";


export class NotificationTemplate extends HookStateClass implements INotificationTemplate{
    id: number;

    static reduxState?: NotificationTemplateState;

    @App.inputType
    name: string;

    @App.inputType
    typeSelect: OptionProps;

    @App.inputType
    content: Partial<Content> = null;

    type: string;

    constructor(notificationTemplate?: Partial<INotificationTemplate> | null) {
        // @ts-ignore
        super(notificationTemplate?.validations || {}, notificationTemplate?._readOnly, notificationTemplate?.wholeInstance);
        this.id = notificationTemplate?.id || notificationTemplate?.templateId || 0;
        this.name = notificationTemplate?.name || '';
        this.typeSelect = notificationTemplate?.typeSelect || null;
        this.type = notificationTemplate?.type || null;
        if(!this.typeSelect && this.type){
            this.typeSelect = {label: this.type, value: this.type};
        }
        if(notificationTemplate?.content){
            let content = notificationTemplate.content;
            if(!(content instanceof Content)){
                content = new Content(content);
            }
            this.content = content;
        }
        // @ts-ignore
        this.dispatch = notificationTemplate.dispatch ? notificationTemplate.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<INotificationTemplate>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}, {functionName: 'content', value: args.content}];
        return super.createState<INotificationTemplate>(
            NotificationTemplate,
            (state: RootState) => state.scheduleNotificationTemplateReducer,
            args,
            observations
        );
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.scheduleNotificationTemplateReducer);
    }

    getText(data: IInput<INotificationTemplateText, InputTextProps>):ReactElement{
        return super.getInputText<INotificationTemplateText, InputTextProps>(data);
    }

    getTexts(data: IInput<INotificationTemplateText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<INotificationTemplateText, InputTextProps>(data);
    }

    getSelect(data: IInput<INotificationTemplateSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<INotificationTemplateSelect, InputSelectProps>(data);
    }

    getFile(data: IInput<INotificationTemplateFile, InputFileProps>): ReactElement {
        return super.getInputFile<INotificationTemplateFile, InputFileProps>(data);
    }

    getTextarea(data: IInput<INotificationTemplateTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<INotificationTemplateTextarea, InputTextareaProps>(data);
    }

    validateName(): boolean{
        let isNotValid = false;
        if(this.name === ''){
            isNotValid = true;
            this.validations['name'] = 'The name is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateName(this, this.name);
            if(!this.isFocused){
                document.getElementById('input_name').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateType(): boolean{
        let isNotValid = false;
        if(this.typeSelect === null){
            isNotValid = true;
            this.validations['typeSelect'] = 'The type is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateTypeSelect(this, this.typeSelect);
            if(!this.isFocused){
                document.getElementById('input_typeSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateSubject(): boolean{
        let isNotValid = false;
        if(this.content.subject === ''){
            isNotValid = true;
            this.content.validations['subject'] = 'The subject is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.content.updateSubject(this, this.content.subject);
            if(!this.isFocused){
                document.getElementById('input_subject').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateBody(): boolean{
        let isNotValid = false;
        if(this.content.body === ''){
            isNotValid = true;
            this.content.validations['body'] = 'The body is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.content.updateBody(this, this.content.body);
            if(!this.isFocused){
                document.getElementById('input_body').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateAdd() {
        this.isFocused = false;
        const isValidName = this.validateName();
        const isValidType = this.validateType();
        const isValidSubject = this.validateSubject();
        const isValidBody = this.validateBody();
        return isValidName && isValidType && isValidSubject && isValidBody;
    }

    @App.dispatch<INotificationTemplate>(getNotificationTemplateById, {mapping: (notificationTemplate: INotificationTemplate) => {return notificationTemplate.id}, hasNoValidation: true})
    getById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(addNotificationTemplate)
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateNotificationTemplate)
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<INotificationTemplate>(deleteNotificationTemplateById, {hasNoValidation: true})
    deleteById(): boolean{
        return this.validateId(this.id);
    }
}