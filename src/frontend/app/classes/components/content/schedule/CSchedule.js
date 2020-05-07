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

import {consoleLog, isId} from "../../../../utils/app";
import CLastExecution from "./CLastExecution";
import CWebhook from "./CWebhook";
import CNotification from "./CNotification";


/**
 * Schedule class for Schedule module
 */
export default class CSchedule{
    constructor(id = 0, title = '', cronExp = '', status = false, timeZone = 0, connection, lastExecution = null, webhook = null, notifications = []){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._title = this.checkTitle(title) ? title : '';
        this._cronExp = cronExp;
        this._status = status;
        this._timeZone = timeZone;
        this._connection = this.checkConnection(connection) ? connection : null;
        this._lastExecution = CLastExecution.createLastExecution(lastExecution);
        this._webhook = CWebhook.createWebhook(webhook);
        this._notifications = this.convertNotifications(notifications);
    }

    static createSchedule(schedule){
        let id = schedule && schedule.hasOwnProperty('schedulerId') ? schedule.schedulerId : 0;
        let title = schedule && schedule.hasOwnProperty('title') ? schedule.title : '';
        let cronExp = schedule && schedule.hasOwnProperty('cronExp') ? schedule.cronExp : '';
        let status = schedule && schedule.hasOwnProperty('status') ? schedule.status : false;
        let timeZone = schedule && schedule.hasOwnProperty('timeZone') ? schedule.timeZone : 0;
        let connection = schedule && schedule.hasOwnProperty('connection') ? schedule.connection : null;
        let lastExecution = schedule && schedule.hasOwnProperty('lastExecution') ? schedule.lastExecution: null;
        let webhook = schedule && schedule.hasOwnProperty('webhook') ? schedule.webhook: null;
        let notifications = schedule && schedule.hasOwnProperty('notifications') ? schedule.notifications: [];
        return new CSchedule(id, title, cronExp, status, timeZone, connection, lastExecution, webhook, notifications);
    }

    checkTitle(title){
        let result = title !== '';
        if(result){
            return true;
        }
        consoleLog(`Schedule with id=${this._id ? this._id : 0} does not have a title`);
        return false;
    }

    checkConnection(connection){
        let result = connection && connection.hasOwnProperty('connectionId') && connection.hasOwnProperty('title');
        if(result){
            return true;
        }
        consoleLog(`Schedule with id=${this._id} does not have connection.connectionId or connection.title`);
        return false;
    }

    convertNotification(notification){
        if(!(notification instanceof CNotification)){
            return CNotification.createNotification(notification);
        }
        return notification;
    }

    convertNotifications(notifications){
        for(let i = 0; i < notifications.length; i++){
            notifications[i] = this.convertNotification(notifications[i]);
        }
        return notifications;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Schedule has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get title(){
        return this._title;
    }

    set title(title){
        this._title = title;
    }

    get cronExp(){
        return this._cronExp;
    }

    set cronExp(cronExp){
        this._cronExp = cronExp;
    }

    get status(){
        return this._status;
    }

    set status(status){
        this._status = status;
    }

    get timeZone(){
        return this._timeZone;
    }

    set timeZone(timeZone){
        this._timeZone = timeZone;
    }

    get connection(){
        return this._connection;
    }

    set connection(connection){
        if(this.checkConnection(connection)) {
            this._connection = connection;
        }
    }

    get lastExecution(){
        return this._lastExecution;
    }

    getSuccessEndTime(){
        return this._lastExecution.successStartTime;
    }

    getSuccessStartTime(){
        return this._lastExecution.successEndTime;
    }

    getSuccessDuration(){
        return this._lastExecution.successDuration;
    }

    getSuccessTaId(){
        return this._lastExecution.successTaId;
    }

    getSuccessExecutionId(){
        return this._lastExecution.successExecutionId;
    }

    getFailEndTime(){
        return this._lastExecution.failEndTime;
    }

    getFailStartTime(){
        return this._lastExecution.failStartTime;
    }

    getFailDuration(){
        return this._lastExecution.failDuration;
    }

    getFailTaId(){
        return this._lastExecution.failTaId;
    }

    getFailExecutionId(){
        return this._lastExecution.failExecutionId;
    }

    set lastExecution(lastExecution){
        this._lastExecution = lastExecution;
    }

    get webhook(){
        return this._webhook;
    }

    getWebhookId(){
        return this._webhook.id;
    }

    getWebhookUrl(){
        return this._webhook.url;
    }

    set webhook(webhook){
        this._webhook = webhook;
    }

    get notifications(){
        return this._notifications;
    }

    getObject(){
        let obj = {
            title: this._title,
            cronExp: this._cronExp,
            status: this._status,
            timeZone: this._timeZone,
            connection: this._connection,
            lastExecution: this._lastExecution.getObject(),
            webhook: this._webhook.getObject(),
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}