/*
 * Copyright (C) <2020>  <becon GmbH>
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

import {consoleLog, isId, isArray} from "../../../../utils/app";
import CNotificationTemplate from "./CNotificationTemplate";

const EVENT_TYPE = {
    PRE: 'pre',
    POST: 'post',
};

const NOTIFICATION_TYPE = {
    EMAIL: 'email',
    SLACK: 'slack',
};

/**
 * Notification class for Schedule module
 */
export default class CNotification{
    constructor(id = 0, eventType = EVENT_TYPE.PRE, notificationType = NOTIFICATION_TYPE.EMAIL, template = null, recipientList = []){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._eventType = this.checkEventType(eventType) ? eventType : '';
        this._notificationType = this.checkNotificationType(notificationType) ? notificationType : '';
        this._template = this.convertTemplate(template);
        this._recipientList = this.checkRecipientList(recipientList);
    }

    static createNotification(notification){
        let id = notification && notification.hasOwnProperty('notificationId') ? notification.notificationId : 0;
        let eventType = notification && notification.hasOwnProperty('eventType') ? notification.eventType : '';
        let notificationType = notification && notification.hasOwnProperty('notificationType') ? notification.notificationType : '';
        let template = notification && notification.hasOwnProperty('template') ? notification.template : null;
        let recipientList = notification && notification.hasOwnProperty('recipientList') ? notification.recipientList : [];
        return new CNotification(id, eventType, notificationType, template, recipientList);
    }

    static duplicateNotification(notification){
        let duplicate;
        if(notification instanceof CNotification){
            duplicate = notification.getObject();
            duplicate.template = {id: notification.template.id, name: notification.template.name};
        } else{
            duplicate = notification;
        }
        return CNotification.createNotification(duplicate);
    }

    checkEventType(eventType){
        for(const key in EVENT_TYPE) {
            if(eventType === EVENT_TYPE[key]){
                return true;
            }
        }
        consoleLog(`Notification of the Schedule has a wrong eventType: ${eventType}`);
        return false;
    }

    checkNotificationType(notificationType){
        for(const key in NOTIFICATION_TYPE) {
            if(notificationType === NOTIFICATION_TYPE[key]){
                return true;
            }
        }
        consoleLog(`Notification of the Schedule has a wrong notificationType: ${notificationType}`);
        return false;
    }

    static getNotificationTypeForSelect(notificationTypeValue, {translate}){
        const allNotificationTypes = CNotification.getAllNotificationTypesForSelect(translate);
        const notificationType = allNotificationTypes.find(e => e.value === notificationTypeValue);
        if(notificationType){
            return notificationType;
        }
        return null;
    }

    convertTemplate(template){
        if(!(template instanceof CNotificationTemplate)){
            return CNotificationTemplate.createNotificationTemplate(template);
        }
        return template;
    }

    static getTemplateForSelect(allTemplateTypes, templateTypeValue){
        const templateType = allTemplateTypes.find(e => e.value === templateTypeValue);
        if(templateType){
            return templateType;
        }
        return null;
    }

    checkRecipientList(recipientList){
        return isArray(recipientList);
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Notification has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get eventType(){
        return this._eventType;
    }

    set eventType(eventType){
        if(this.checkEventType(eventType)) {
            this._eventType = eventType;
        }
    }

    static getAllNotificationTypesForSelect(translate){
        let types = [];
        for(const key in NOTIFICATION_TYPE) {
            types.push({label: translate(`NOTIFICATION.TYPE.${key.toUpperCase()}`), value: NOTIFICATION_TYPE[key]});
        }
        return types;
    }

    get notificationType(){
        return this._notificationType;
    }

    set notificationType(notificationType){
        if(this.checkNotificationType(notificationType)) {
            this._notificationType = notificationType;
        }
    }

    setNotificationTypeFromSelect(notificationType){
        const {value} = notificationType;
        if(this.checkNotificationType(value)) {
            this._notificationType = value;
        }
    }

    get template(){
        return this._template;
    }

    set template(template){
        this._template = this.convertTemplate(template);
    }

    setTemplateFromSelect(template){
        this._template = this.convertTemplate({id: template.value, name: template.label});
    }

    get recipientList(){
        return this._recipientList;
    }

    /*
    * add recipient if such does not exist in recipient list
    *
    * @param recipient
    */
    addRecipientList(recipient){
        if(recipient && recipient.hasOwnProperty('id')) {
            if (this._recipientList.findIndex(r => r.id === recipient.id) === -1) {
                this._recipientList.push(recipient);
            }
        }
    }

    /*
    * delete recipient if such does exist in recipient list
    *
    * @param recipient id
    */
    deleteRecipientListById(id){
        const index = this._recipientList.findIndex(r => r.id === id);
        if (index !== -1) {
            this._recipientList.splice(index, 1);
        }
    }

    getObject(){
        let obj = {
            eventType: this._eventType,
            notificationType: this._notificationType,
            template: this._template.id,
            recipientList: this._recipientList,
        };
        if(this.hasOwnProperty('_id') && this._id !== 0){
            obj.id = this._id;
        }
        return obj;
    }
}