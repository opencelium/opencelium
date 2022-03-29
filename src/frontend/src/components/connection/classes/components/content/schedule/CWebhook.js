/*
 * Copyright (C) <2021>  <becon GmbH>
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

import {consoleLog, isId, isString} from "@utils/app";


/**
 * Webhook class for Schedule module
 */
export default class CWebhook{
    constructor(id = 0, url = ''){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._url = this.checkUrl(url) ? url : '';
    }

    static createWebhook(webhook){
        let id = webhook && webhook.hasOwnProperty('webhookId') ? webhook.webhookId : 0;
        let url = webhook && webhook.hasOwnProperty('url') ? webhook.url : '';
        return new CWebhook(id, url);
    }

    checkUrl(url){
        let result = isString(url);
        if(result){
            return true;
        }
        consoleLog(`Webhook with id ${this._id ? this._id : 0} has a url that is not string`);
        return false;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Webhook has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get url(){
        return this._url;
    }

    set url(url){
        if(this.checkUrl(url)) {
            this._url = url;
        }
    }

    getObject(){
        let obj = {
            url: this._url,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}