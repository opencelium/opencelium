/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {capitalize} from "@application/utils/utils";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@app_component/base/input/select/interfaces";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {INotificationTemplate} from "@entity/notification_template/interfaces/INotificationTemplate";
import {IUserRadios} from "@entity/user/interfaces/IUser";
import {
    EVENT_TYPE,
    INotification,
    INotificationSelect,
    INotificationText,
} from "../interfaces/INotification";
import {NotificationState} from "../redux_toolkit/slices/NotificationSlice";
import {
    addNotification,
    deleteNotificationById,
    getNotificationByScheduleIdAndId,
    updateNotification
} from "../redux_toolkit/action_creators/NotificationCreators";

export class Notification extends HookStateClass implements INotification{
    id: number;

    scheduleId: number;

    static reduxState?: NotificationState;

    @App.inputType
    name: string = '';

    @App.inputType
    eventType: EVENT_TYPE = EVENT_TYPE.PRE;

    @App.inputType
    typeSelect: OptionProps;

    @App.inputType
    templateSelect: OptionProps;

    @App.inputType
    recipientsSelect: OptionProps[];

    type: string = '';

    template: INotificationTemplate = null;

    recipients: string[] = [];

    constructor(notification?: Partial<INotification> | null) {
        // @ts-ignore
        super(notification?.validations || {}, notification?._readOnly, notification?.wholeInstance);
        this.id = notification?.id || notification?.notificationId || 0;
        this.scheduleId = notification?.scheduleId || notification?.schedulerId || 0;
        this.name = notification?.name || '';
        this.eventType = notification?.eventType || EVENT_TYPE.PRE;
        this.typeSelect = notification?.typeSelect || null;
        this.type = notification?.type || notification?.notificationType || '';
        if(!this.typeSelect && this.type !== ''){
            this.typeSelect = {label: capitalize(this.type), value: this.type};
        }
        this.templateSelect = notification?.templateSelect || null;
        this.template = notification?.template || null;
        if(!this.templateSelect && this.template){
            this.templateSelect = {label: this.template.name, value: this.template.templateId};
        }
        this.recipientsSelect = notification?.recipientsSelect || [];
        this.recipients = notification?.recipients || [];
        if(this.recipientsSelect.length === 0 && this.recipients.length > 0){
            this.recipientsSelect = this.recipients.map(recipient => {return {label: recipient, value: recipient};})
        }
        // @ts-ignore
        this.dispatch = notification.dispatch ? notification.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<INotification>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}];
        return super.createState<INotification>(
            Notification,
            (state: RootState) => state.scheduleNotificationReducer,
            args,
            observations);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.scheduleNotificationReducer);
    }

    getText(data: IInput<INotificationText, InputTextProps>):ReactElement{
        return super.getInputText<INotificationText, InputTextProps>(data);
    }

    getTexts(data: IInput<INotificationText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<INotificationText, InputTextProps>(data);
    }

    getSelect(data: IInput<INotificationSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<INotificationSelect, InputSelectProps>(data);
    }

    getRadios(data: IInput<IUserRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IUserRadios, InputRadiosProps>(data);
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

    validateTemplate(): boolean{
        let isNotValid = false;
        if(this.templateSelect === null){
            isNotValid = true;
            this.validations['templateSelect'] = 'The template is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateTemplateSelect(this, this.templateSelect);
            if(!this.isFocused){
                document.getElementById('input_templateSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateRecipients(): boolean{
        let isNotValid = false;
        if(this.recipientsSelect.length === 0){
            isNotValid = true;
            this.validations['recipientsSelect'] = 'The recipients is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateRecipientsSelect(this, this.recipientsSelect);
            if(!this.isFocused){
                document.getElementById('input_recipientsSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateAdd(): boolean{
        this.isFocused = false;
        const isValidName = this.validateName();
        const isValidType = this.validateType();
        const isValidTemplate = this.validateTemplate();
        const isValidRecipients = this.validateRecipients();
        return isValidName && isValidType && isValidTemplate && isValidRecipients;
    }

    @App.dispatch<INotification>(getNotificationByScheduleIdAndId, {mapping: (notification: INotification) => {return {id: notification.id, scheduleId: notification.scheduleId};}, hasNoValidation: true})
    getById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(addNotification)
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateNotification)
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<INotification>(deleteNotificationById, {hasNoValidation: true})
    deleteById(): boolean{
        return this.validateId(this.id);
    }
}