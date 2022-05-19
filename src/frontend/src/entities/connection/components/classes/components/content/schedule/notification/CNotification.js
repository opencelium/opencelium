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

import {consoleLog} from "@application/utils/utils";
import CNotificationTemplate from "./CNotificationTemplate";
import CSlack from "./CSlack";
import CEmail from "./CEmail";
import {isId} from "@application/utils/utils";

export const EVENT_TYPE = {
    PRE: 'pre',
    POST: 'post',
    ALERT: 'alert',
};

export const NOTIFICATION_TYPE = {
    EMAIL: 'email',
    //SLACK: 'slack',
};

/**
 * Notification class for Schedule module
 */
export default class CNotification{
    constructor(id = 0, name = '', eventType = '', notificationType = '', template = null, targetGroup = null){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._name = name;
        this._eventType = this.checkEventType(eventType) ? eventType : '';
        this._notificationType = CNotification.checkNotificationType(notificationType) ? notificationType : '';
        this._template = this.convertTemplate(template);
        this._targetGroup = this.setTargetGroup(targetGroup);
    }

    static createNotification(notification){
        let id = notification && notification.hasOwnProperty('notificationId') ? notification.notificationId : 0;
        let name = notification && notification.hasOwnProperty('name') ? notification.name : '';
        let eventType = notification && notification.hasOwnProperty('eventType') ? notification.eventType : '';
        let notificationType = notification && notification.hasOwnProperty('notificationType') ? notification.notificationType : '';
        let template = notification && notification.hasOwnProperty('template') ? notification.template : null;
        let targetGroup = notification && notification.hasOwnProperty('recipients') ? notification.recipients : null;
        return new CNotification(id, name, eventType, notificationType, template, targetGroup);
    }

    /**
     * duplicate notification and create new instance of CNotification
     *
     * @param notification
     */
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

    /**
     * check if such eventType exists
     *
     * @param eventType
     */
    checkEventType(eventType){
        for(const key in EVENT_TYPE) {
            if(eventType === EVENT_TYPE[key]){
                return true;
            }
        }
        consoleLog(`Notification of the Schedule has a wrong eventType: ${eventType}`);
        return false;
    }

    /**
     * check if such notificationType exists
     *
     * @param notificationType
     */
    static checkNotificationType(notificationType){
        if(notificationType === ''){
            return true;
        }
        for(const key in NOTIFICATION_TYPE) {
            if(notificationType === NOTIFICATION_TYPE[key]){
                return true;
            }
        }
        consoleLog(`Notification of the Schedule has a wrong notificationType: ${notificationType}`);
        return false;
    }

    /**
     * convert into CNotificationTemplate instance
     *
     * @param template
     */
    convertTemplate(template){
        if(!(template instanceof CNotificationTemplate)){
            return CNotificationTemplate.createNotificationTemplate(template);
        }
        return template;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Notification has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get eventType(){
        return this._eventType;
    }

    /**
     * translate event type
     *
     * @param translate - translate function
     */
    getTranslatedEventType(translate){
        return translate(`schedules:NOTIFICATION.EVENT_${this._eventType.toUpperCase()}`);
    }

    /**
     * get all translated notification types
     *
     * @param translate - translate function
     */
    static getAllNotificationTypesForSelect(translate){
        let types = [];
        for(const key in NOTIFICATION_TYPE) {
            types.push({
                label: translate(`schedules:NOTIFICATION.TYPE.${key.toUpperCase()}`),
                value: NOTIFICATION_TYPE[key],
            });
        }
        return types;
    }

    set eventType(eventType){
        if(this.checkEventType(eventType)) {
            this._eventType = eventType;
        }
    }

    get notificationType(){
        return this._notificationType;
    }

    /**
     * find the right notification type for select input
     *
     * @param notificationTypeValue - notification type that should be found
     * @param {translate} - translate function
     */
    static getNotificationTypeForSelect(notificationTypeValue, {translate}){
        const allNotificationTypes = CNotification.getAllNotificationTypesForSelect(translate);
        const notificationType = allNotificationTypes.find(e => e.value === notificationTypeValue);
        if(notificationType){
            return notificationType;
        }
        return null;
    }

    /**
     * translate notification type
     *
     * @param translate - translate function
     */
    getTranslatedNotificationType(translate){
        return translate(`schedules:NOTIFICATION.TYPE.${this._notificationType.toUpperCase()}`);
    }

    set notificationType(notificationType){
        if(CNotification.checkNotificationType(notificationType)) {
            this._notificationType = notificationType;
            this._targetGroup = this.setTargetGroup();
        }
    }

    /**
     * set notification type that came from select input
     * and resetting target group
     *
     * @param notificationType - parameter that came from select input when u choose it
     */
    setNotificationTypeFromSelect(notificationType){
        const {value} = notificationType;
        if(CNotification.checkNotificationType(value)) {
            this._notificationType = value;
            this._targetGroup = this.setTargetGroup();
        }
    }

    get template(){
        return this._template;
    }

    /**
     * find the template in all templates for select input
     *
     * @param allTemplateTypes - all template types
     * @param templateTypeValue - value of template type that should be found
     */
    static getTemplateForSelect(allTemplateTypes, templateTypeValue){
        const templateType = allTemplateTypes.find(e => e.value === templateTypeValue);
        if(templateType){
            return templateType;
        }
        return null;
    }

    set template(template){
        this._template = this.convertTemplate(template);
    }

    /**
     * set template format from select input
     *
     * @param template - parameter that came from select input when u choose it
     */
    setTemplateFromSelect(template){
        this._template = this.convertTemplate({templateId: template ? template.value : 0, name: template ? template.label : ''});
    }

    get targetGroup(){
        return this._targetGroup;
    }

    /**
     * set target group depending on notification type
     *
     * @param targetGroup
     */
    setTargetGroup(targetGroup){
        switch (this._notificationType) {
            case NOTIFICATION_TYPE.SLACK:
                return CSlack.createSlack(targetGroup);
            case NOTIFICATION_TYPE.EMAIL:
                return CEmail.createEmail(targetGroup);
            default:
                return CEmail.createEmail(targetGroup);
        }
    }

    getObject(){
        let obj = {
            name: this._name,
            eventType: this._eventType,
            notificationType: this._notificationType,
            template: {templateId: this._template.id, name: this._template.name},
            recipients: this._targetGroup.getObject().recipients,
        };
        if(this.hasOwnProperty('_id') && this._id !== 0){
            obj.notificationId = this._id;
        }
        return obj;
    }
}