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


import {isArray} from "../../../../../utils/app";

/**
 * Email class as notification type
 */
export default class CEmail{
    constructor(recipients = [], subject='', body = '', language = ''){
        this._recipients = this.checkRecipients(recipients) ? recipients : [];
        this._subject = subject;
        this._body = body;
        this._language = language;
    }

    static createEmail(slack){
        let recipients = slack && slack.hasOwnProperty('recipients') ? slack.recipients : [];
        let subject = slack && slack.hasOwnProperty('subject') ? slack.subject : '';
        let body = slack && slack.hasOwnProperty('body') ? slack.body : '';
        let language = slack && slack.hasOwnProperty('language') ? slack.language : '';
        return new CEmail(recipients, subject, body, language);
    }

    checkRecipients(recipients){
        return isArray(recipients);
    }

    get recipients(){
        return this._recipients;
    }

    get subject(){
        return this._subject;
    }

    set subject(subject){
        this._subject = subject;
    }

    get body(){
        return this._body;
    }

    set body(body){
        this._body = body;
    }

    get language(){
        return this._language;
    }

    set language(language){
        this._language = language;
    }

    /**
    * add recipient if such does not exist in recipient list
    *
    * @param recipient
    */
    addRecipient(recipient){
        if(recipient && recipient.hasOwnProperty('userId')) {
            if (this._recipients.findIndex(r => r.userId === recipient.userId) === -1) {
                this._recipients.push(recipient);
            }
        }
    }

    /**
    * delete recipient if such does exist in recipient list
    *
    * @param recipient id
    */
    deleteRecipient(recipient){
        if(recipient && recipient.hasOwnProperty('userId')) {
            const index = this._recipients.findIndex(r => r.userId === recipient.userId);
            if (index !== -1) {
                this._recipients.splice(index, 1);
            }
        }
    }

    getObject(){
        let obj = {
            recipients: this._recipients,
            subject: this._subject,
            body: this._body,
            language: this._language,
        };
        return obj;
    }
}