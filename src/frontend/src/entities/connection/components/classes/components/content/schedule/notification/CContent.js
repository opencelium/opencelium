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


import {isId} from "@application/utils/utils";

/**
 * Content class
 */
export default class CContent{
    constructor(id = 0, subject = '', body = '', language = 'en'){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._subject = subject;
        this._body = body;
        this._language = language;
    }

    static createContent(content){
        let id = content && content.hasOwnProperty('contentId') ? content.contentId : 0;
        let subject = content && content.hasOwnProperty('subject') ? content.subject : '';
        let body = content && content.hasOwnProperty('body') ? content.body : '';
        let language = content && content.hasOwnProperty('language') ? content.language : 'en';
        return new CContent(id, subject, body, language);
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

    getObject(){
        let obj = {
            subject: this._subject,
            body: this._body,
            language: this._language,
        };
        if(this.hasOwnProperty('_id')){
            obj.contentId = this._id;
        }
        return obj;
    }
}