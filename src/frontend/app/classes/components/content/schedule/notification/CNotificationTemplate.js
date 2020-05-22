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
import {NO_DATA} from "../../../../../utils/constants/app";
import CNotification, {NOTIFICATION_TYPE} from "./CNotification";
import CSlack from "./CSlack";
import CEmail from "./CEmail";
import CContent from "./CContent";


/**
 * Notification Template class for Notification module
 */
/*
* TODO: set content as a default [] instead of [null] for more than one language
*/
export default class CNotificationTemplate{
    constructor(id = 0, name = '', type = '', content = [null]){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._name = this.checkName(name) ? name : '';
        this._type = CNotification.checkNotificationType(type) ? type : '';
        this._content = this.convertContent(content);
    }

    static createNotificationTemplate(notificationTemplate){
        let id = notificationTemplate && notificationTemplate.hasOwnProperty('templateId') ? notificationTemplate.templateId : 0;
        let name = notificationTemplate && notificationTemplate.hasOwnProperty('name') ? notificationTemplate.name : '';
        let type = notificationTemplate && notificationTemplate.hasOwnProperty('type') ? notificationTemplate.type : '';
        let content = notificationTemplate && notificationTemplate.hasOwnProperty('content') ? notificationTemplate.content : [null];
        return new CNotificationTemplate(id, name, type, content);
    }

    /**
     * check name if it is valid
     *
     * @param name
     */
    checkName(name){
        let result = isString(name);
        if(result){
            return true;
        }
        consoleLog(`Notification Template with id ${this._id ? this._id : 0} has a name that is not string`);
        return false;
    }

    /**
     * convert into CContent instance
     *
     * @param contentItem
     */
    convertContentItem(contentItem){
        if(!(contentItem instanceof CContent)) {
            return CContent.createContent(contentItem);
        }
        return contentItem;
    }

    /**
     * convert into array of CContent instances with at least one element
     *
     * @param content
     */
    convertContent(content = [null]){
        let result = [];
        for (let i = 0; i < content.length; i++) {
            if(!(content[i] instanceof CContent)){
                result.push(this.convertContentItem(content[i]));
            }
        }
        return result;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Notification Template has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get name(){
        return this._name;
    }

    set name(name){
        if(this.checkName(name)) {
            this._name = name;
        }
    }
    get type(){
        return this._type;
    }

    set type(type){
        if(CNotification.checkNotificationType(type)) {
            this._type = type;
        }
    }

    get content(){
        return this._content;
    }

    /**
     * add or update contentItem in content by language
     *
     * @param contentItem
     */
    changeContentByLanguage(contentItem){
        if(isString(contentItem.language)){
            const contentItemIndex = this._content.findIndex(c => c.language === contentItem.language);
            const isExist = contentItemIndex !== -1;
            if(!isExist){
                this._content.push(contentItem);
            } else{
                this._content[contentItemIndex] = contentItem;
            }
        }
    }

    /**
     * set type from select input
     *
     * @param type
     */
    setTypeFromSelect(type){
        const {value} = type;
        if(CNotification.checkNotificationType(value)) {
            this._type = value;
        }
    }

    getObject(){
        let obj = {
            name: this._name,
            type: this._type,
        };
        if(this.hasOwnProperty('_id')){
            obj.templateId = this._id;
        }
        return obj;
    }
}