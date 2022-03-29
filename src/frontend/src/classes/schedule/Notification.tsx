import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    EVENT_TYPE,
    INotification,
    INotificationSelect,
    INotificationText,
} from "@interface/schedule/INotification";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import {RootState} from "@store/store";
import {NotificationState} from "@slice/schedule/NotificationSlice";
import {IUserRadios} from "@interface/user/IUser";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {
    addNotification,
    deleteNotificationById,
    getNotificationByScheduleIdAndId,
    updateNotification
} from "@action/schedule/NotificationCreators";
import {capitalize} from "../../utils";
import {INotificationTemplate} from "@interface/schedule/INotificationTemplate";

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

    getTexts(data: IInput<INotificationText, InputTextProps>[]):ReactNodeArray{
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