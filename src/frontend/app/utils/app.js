/*
 * Copyright (C) <2019>  <becon GmbH>
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

import React from 'react';
import CUserGroup from "../classes/components/content/user_group/CUserGroup";
import CComponent from "../classes/components/content/user_group/CComponent";


/**
 * flag for debugging in console
 */
export const DEBUGGER_LOGS = true;
export const DEBUGGER_ERRORS = true;

/**
 * messages from backend if token was expired
 */
export const TOKEN_EXPIRED_MESSAGES = ['TOKEN_EXPIRED', 'Access Denied'];


/**
 * callback to sort by index
 */
export function sortByIndexFunction(a, b){
    if(a.index < b.index){return -1;} if(a.index > b.index){return 1;} return 0;
}

/**
 * on enter event
 */
export function onEnter(e, callback){
    if(e.key === 'Enter'){
        callback();
    }
}

/**
 * check params of the object on valid type
 */
export function checkAndDoParam(obj, param, type){
    switch(type){
        case 'id':
            if(obj !== null) {
                return obj.hasOwnProperty(param) && isInteger(obj[param]) && obj[param] > 0 ? obj[param] : -1;
            } else{
                return isInteger(param) && param > 0 ? param : -1;
            }
        case 'string':
            if(obj !== null) {
                return obj.hasOwnProperty(param) && isString(obj[param]) ? obj[param] : '';
            } else{
                return isString(param) ? param : '';
            }
        case 'object':
            if(obj !== null) {
                return obj.hasOwnProperty(param) && isObject(obj[param]) ? obj[param] : null;
            } else{
                return isObject(param) ? param : null;
            }
        default:
            consoleLog('Wrong type of data');
            break;
    }
    return null;
}

/**
 * check if image is valid or not
 * @param image - data
 * @param onSuccess - on success callback
 * @param onFail - on fail callback
 */
export function checkImage(image, onSuccess, onFail){
    if(typeof image === 'string' && image !== '') {
        let img = new Image();
        img.onload = onSuccess;
        img.onerror = onFail;
        img.src = image;
    } else {
        onFail();
    }
}

/**
 * shuffle array
 */
export function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * focus input by id
 */
export function setFocusById(id){
    let nameElement = document.getElementById(id);
    const inputs = ['input', 'select', 'button', 'textarea'];
    if (nameElement) {
        if(inputs.indexOf(nameElement.tagName.toLowerCase()) === -1){
            nameElement = nameElement.querySelector('input');
        }
        if(nameElement) {
            setTimeout(() => {
                nameElement.focus()
            }, 100);
        }
    }
}

/**
 * cut subarray and convert to string with separator
 */
export function subArrayToString(arr, separator,start,end){
    if(!start) start = 0;
    if(!end) end = arr.length - 1;
    return arr.slice(start,end).join(separator);
}

/**
 * clone Object
 */
export function cloneObject(obj) {
    let copy = {};
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) {
            copy[attr] = obj[attr];
        }
    }
    return copy;
}

/**
 * return unique Array
 */
export function uniqueArray(a){
    return a.filter(function(item, pos) {
        return a.indexOf(item) === pos;
    });
}

/**
 * console.log in debug mode
 */
export function consoleLog(value){
    if(DEBUGGER_LOGS) {
        console.log(value);
    }
}
/**
 * console.error in debug mode
 */
export function consoleError(value){
    if(DEBUGGER_ERRORS) {
        console.error(value);
    }
}

/**
 * check if element is Number
 */
export function isNumber(number){
    return !isNaN(parseInt(number));
}

/**
 * check if element is ID
 */
export function isId(id){
    let result = isNumber(id) && id > 0;
    return !!result;

}

/**
 * check if element is Integer
 */
export function isInteger(number) {
    Number.isInteger(number);
}

/**
 * check if element is String
 */
export function isString(str){
    return typeof str  === 'string';
}

/**
 * check if string is in json format
 */
export function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * check if an Object is empty
 */
export function isEmptyObject(obj){
    if(isObject(obj)) {
        return Object.getOwnPropertyNames(obj).length === 0;
    }
    return false;
}

/**
 * capitalize first charachter of the string
 */
export function capitalize(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * check if element is an Object
 */
export function isObject (value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

/**
 * check if element is an Array
 */
export function isArray(array){
    return Array.isArray(array);
}

export function getInputsState(inputs){
    let obj = {};
    if(Array.isArray(inputs)) {
        inputs.forEach(input => input.hasOwnProperty('defaultValue') ? obj[input.name] = input.defaultValue : obj[input.name] = '');
    }
    return obj;
}

/**
 * convert cron expression value in ScheduleList component
 */
export function convertCronExpForSchedulerlist(cronExp){
    return cronExp;
}

/**
 * convert time value in ScheduleList component
 */
export function convertTimeForSchedulerList(t, mode = 'short'){
    let date = new Date(t);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let dateValue = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    seconds = seconds < 10 ? '0'+seconds : seconds;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    dateValue = dateValue < 10 ? '0'+dateValue : dateValue;
    month = month < 10 ? '0'+month : month;
    switch(mode){
        case 'short':
            return `${hours}:${minutes}`;
        case 'full':
            return `${dateValue}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    }
}

/**
 * get classnames from the theme
 */
export function getThemeClass({classNames, authUser, styles}){
    if(authUser && authUser.userDetail && authUser.userDetail.hasOwnProperty('theme') && authUser.userDetail.theme && styles) {
        let theme = authUser.userDetail.theme;
        if (theme !== 'default') {
            if (isArray(classNames)) {
                let themedClassNames = {};
                for (let i = 0; i < classNames.length; i++) {
                    if(styles[`${classNames[i]}___theme__${theme}`]) {
                        themedClassNames[classNames[i]] = `${classNames[i]}___theme__${theme}`;
                    } else{
                        themedClassNames[classNames[i]] = classNames[i];
                    }
                }
                return themedClassNames;
            } else {
                if(styles[`${classNames}___theme__${theme}`]) {
                    return `${classNames}___theme__${theme}`;
                } else{
                    return classNames;
                }
            }
        }
    }
    if (isArray(classNames)) {
        let themedClassNames = {};
        for (let i = 0; i < classNames.length; i++) {
            themedClassNames[classNames[i]] = classNames[i];
        }
        return themedClassNames;
    } else {
        return classNames;
    }
}

/**
 * copy text to a clipboard
 */
export function copyStringToClipboard(str) {
    let el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

/**
 * update object immutably
 */
export const updateObj = (obj, prop, value) => {
    let tmp = obj;
    tmp[prop] = value;
    return Object.assign({}, obj, tmp);
};

/**
 * generate label that has key navigation
 */
export function generateLabel(text, index, classNames = {keyNavigationTitle: 'key_navigation_title', keyNavigationLetter: 'key_navigation_letter'}){
    let startText = text.substr(0, index);
    let selectedLetter = text.charAt(index);
    let endText = text.substr(index + 1);
    return <span className={classNames.keyNavigationTitle}>{startText}<span className={classNames.keyNavigationLetter}>{selectedLetter}</span>{endText}</span>;
}

/**
 * inject FieldBinding parameter into coming Connection
 */
export function injectFieldBindingIntoConnection(connection){
    injectFieldBinding(connection);
}

/**
 * convert field binding with the right parameter names
 */
export function convertFieldBindingElement(data){
    let result = [];
    for(let i = 0; i < data.length; i++){
        result.push({
            type: data[i].hasOwnProperty('exchangeType') ? data[i].exchangeType : data[i].type,
            methodKey: data[i].hasOwnProperty('methodKey') ? data[i].methodKey : data[i].methodKey,
            field: data[i].hasOwnProperty('name') ? data[i].name : data[i].field,
        });
    }
    return result;
}

/**
 * convert binding with the right parameter names
 */
function convertBindingElement(data){
    let result = [];
    for(let i = 0; i < data.length; i++){
        result.push({
            exchangeType: data[i].hasOwnProperty('exchangeType') ? data[i].exchangeType : data[i].type,
            methodKey: data[i].hasOwnProperty('methodKey') ? data[i].methodKey : data[i].methodKey,
            name: data[i].hasOwnProperty('name') ? data[i].name : data[i].field,
        });
    }
    return result;
}

/**
 * inject FieldBinding param into coming Connection
 */
function injectFieldBinding(connection){
    let fieldBinding = connection.hasOwnProperty('fieldBinding') ? connection.fieldBinding : null;
    let toConnector = connection && connection.hasOwnProperty('connectorList') ? connection.connectorList[1] : null;
    if(fieldBinding && toConnector && toConnector.hasOwnProperty('startAction')) {
        let action = toConnector.startAction;
        placeBinding(action, fieldBinding);
    }
}

/**
 * put binding recursively
 */
function placeBinding(action, fieldBinding){
    if(action && fieldBinding) {
        while (true) {
            let bindings = fieldBinding.filter(b => b.to[0].methodKey === action.key);
            for(let i = 0; i < bindings.length; i++) {
                if (bindings[i]) {
                    let index = action.fieldList.findIndex(f => f.name === bindings[i].to[0].field);
                    if (index >= 0) {
                        action.fieldList[index].binding = {
                            from: convertBindingElement(bindings[i].from),
                            enhancement: bindings[i].enhancement
                        };
                    }
                }
            }
            if (action && action.hasOwnProperty('bodyAction') && action.bodyAction !== null) {
                placeBinding(action.bodyAction, fieldBinding);
            }
            if (action && action.hasOwnProperty('nextAction') && action.nextAction !== null) {
                action = action.nextAction;
            } else {
                break;
            }
        }
    }
}

/**
 * mapping for front_back_mapping middleware
 */
function mapEntities(entities, mapEntity){
    let result = [];
    if(entities && isArray(entities)) {
        for (let i = 0; i < entities.length; i++) {
            result.push(mapEntity(entities[i]));
        }
        return result;
    }
    return entities;
}
function mapUserDetail(userDetail){
    if(userDetail) {
        let result = {};
        result.name = userDetail.name;
        result.surname = userDetail.surname;
        result.profilePicture = userDetail.profilePicture;
        result.phoneNumber = userDetail.phoneNumber;
        result.department = userDetail.department;
        result.organisation = userDetail.organisation;
        result.userTitle = userDetail.userTitle;
        result.requestTime = userDetail.requestTime;
        result.appTour = userDetail.appTour;
        result.theme = userDetail.theme;
        return result;
    }
    return userDetail;
}
function mapUser(user){
    if(user) {
        let result = {};
        result.id = user.userId;
        result.email = user.email;
        result.userDetail = mapUserDetail(user.userDetail);
        result.userGroups = mapEntities(user.userGroup, mapUserGroup);
        return result;
    }
    return user;
}
function mapUserGroup(userGroup){
    return CUserGroup.createUserGroup(userGroup);
}
function mapComponent(component){
    return CComponent.createComponent(component);
}
function mapConnection(connection){
    if(connection){
        let result = {};
        if(connection.hasOwnProperty('id') || connection.hasOwnProperty('connectionId')){
            result.connectionId = connection.connectionId;
        }
        if(connection.hasOwnProperty('title')) {
            result.title = connection.title;
        }
        if(connection.hasOwnProperty('description')) {
            result.description = connection.description;
        }
        if(connection.hasOwnProperty('fromConnector')) {
            result.fromConnector = connection.fromConnector;
        }
        if(connection.hasOwnProperty('toConnector')) {
            result.toConnector = connection.toConnector;
        }
        if(connection.hasOwnProperty('connectorList')) {
            result.connectorList = connection.connectorList;
        }
        if(connection.hasOwnProperty('fieldBinding')) {
            result.fieldBinding = connection.fieldBinding;
        }
        if(connection.hasOwnProperty('webhook')) {
            result.webhook = connection.webhook;
        }
        injectFieldBinding(connection);
        return result;
    }
    return connection;
}
function mapSchedule(schedule){
    return schedule;
}
function mapConnector(connector){
    let result = null;
    if(connector) {
        result = {};
        if(connector.hasOwnProperty('connectorId')) {
            result.id = connector.connectorId;
        }
        if(connector.hasOwnProperty('title')) {
            result.name = connector.title;
        }
        if(connector.hasOwnProperty('description')) {
            result.description = connector.description;
        }
        if(connector.hasOwnProperty('requestData')) {
            result.requestData = connector.requestData;
        }
        if(connector.hasOwnProperty('invoker')) {
            result.invoker = mapInvoker(connector.invoker);
        }
    }
    return result;
}
function mapRequestField(requestField){
    if(requestField){
        let result = {};
        result.exchangeType = requestField.exchangeType;
        result.fieldType = requestField.fieldType;
        result.name = requestField.name;
        result.subFieldList = requestField.subFieldList;
        result.value = requestField.value;
        return result;
    }
    return requestField;
}
function mapResponseField(responseField){
    if(responseField){
        let result = {};
        result.exchangeType = responseField.exchangeType;
        result.fieldType = responseField.fieldType;
        result.name = responseField.name;
        result.subFieldList = responseField.subFieldList;
        result.value = responseField.value;
        return result;
    }
    return responseField;
}
function mapOperation(operation){
    return operation;
}
function mapInvoker(invoker){
    return invoker;
}
export const FrontBackMap = {
    USER: mapUser,
    USERS: (entities) => mapEntities(entities, mapUser),
    USERGROUP: mapUserGroup,
    USERGROUPS: (entities) => mapEntities(entities, mapUserGroup),
    COMPONENT: mapComponent,
    COMPONENTS: (entities) => mapEntities(entities, mapComponent),
    CONNECTION: mapConnection,
    CONNECTIONS: (entities) => mapEntities(entities, mapConnection),
    SCHEDULE: mapSchedule,
    SCHEDULES: (entities) => mapEntities(entities, mapSchedule),
    CONNECTOR: mapConnector,
    CONNECTORS: (entities) => mapEntities(entities, mapConnector),
    INVOKER: mapInvoker,
    INVOKERS: (entities) => mapEntities(entities, mapInvoker),
};