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

import {consoleLog, isId, isString} from "../../../../../utils/app";


/**
 * Slack class as notification type
 */
export default class CSlack{
    constructor(id = 0, channelName = '', message = ''){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._channelName = channelName;
        this._message = message;
    }

    static createSlack(slack){
        let id = slack && slack.hasOwnProperty('slackId') ? slack.slackId : 0;
        let channelName = slack && slack.hasOwnProperty('channelName') ? slack.channelName : '';
        let message = slack && slack.hasOwnProperty('message') ? slack.message : '';
        return new CSlack(id, channelName, message);
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Slack has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get channelName(){
        return this._channelName;
    }

    /**
     * get channel value for select input
     */
    getChannelForSelect(){
        if(this._channelName !== '') {
            return {
                value: this._id,
                label: this._channelName,
            };
        }
        return null;
    }

    /**
     * set channel by value from select input
     *
     * @param channel
     */
    setChannelFromSelect(channel){
        const {value, label} = channel;
        if(isString(label)) {
            this._id = value;
            this._channelName = label;
        }
    }

    get message(){
        return this._message;
    }

    set message(message){
        this._message = message;
    }

    getObject(){
        let obj = {
            channelName: this._channelName,
            message: this._message,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}