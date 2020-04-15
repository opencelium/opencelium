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
export const TOKEN_EXPIRED_MESSAGES = ['TOKEN_EXPIRED', 'Access Denied', 'UNSUPPORTED_HEADER_AUTH_TYPE'];


/**
 * to format html id
 *
 * @param id - id of the html element
 */
export function formatHtmlId(id){
    if(isString(id)) {
        return id.replace(' ', '_').toLowerCase();
    }
    return 'no_id';
}

/**
 * to validate before add schedule
 *
 * @param connectionPointer - string pointer for connection
 * #format [color].([response|request]).[success|error].[parameter name]
 * #example #e2e2e2.(response).success.result.title
 */
export function parseConnectionPointer(connectionPointer){
    let result = {
        color: '',
        field: '',
        type: '',
    };
    if(isString(connectionPointer)){
        let parsedConnectionPointer = connectionPointer.split('.');
        if(parsedConnectionPointer.length > 2){
            result.color = parsedConnectionPointer[0];
            result.type = parsedConnectionPointer[1].substring(1, parsedConnectionPointer[1].length - 1);
            result.field = subArrayToString(parsedConnectionPointer, '.', 2, parsedConnectionPointer.length);
        }
    }
    return result;
}

export function sortByIndex(array){
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    return array.sort(sortByIndexFunction, collator);
}

/**
 * a callback to sort by index
 */
export function sortByIndexFunction(a, b){
    return a.index.localeCompare(b.index, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}

/**
 * a callback to search by name
 */
export function searchByNameFunction(element, searchValue){
    let elementValue = element && element.hasOwnProperty('name') ? element.name.toUpperCase() : element && element.hasOwnProperty('title') ? element.title.toUpperCase() : '';
    if(elementValue === ''){
        if(element.hasOwnProperty('userDetail') && element.userDetail && element.userDetail.hasOwnProperty('name')){
            elementValue = element.userDetail.name.toUpperCase();
        } else if(element instanceof CUserGroup) {
            elementValue = element.role.toUpperCase();
        } else{
            return true;
        }
    }
    return elementValue.indexOf(searchValue.toUpperCase()) !== -1;
}

/**
 * a callback to sort by name
 */
export function sortByNameFunction(a, b){
    let propertyA = a && a.hasOwnProperty('name') ? a.name.toUpperCase() : a.hasOwnProperty('title') ? a.title.toUpperCase() : '';
    let propertyB = b && b.hasOwnProperty('name') ? b.name.toUpperCase() : b.hasOwnProperty('title') ? b.title.toUpperCase() : '';
    if(propertyA === '' && propertyB === ''){
        if(a.hasOwnProperty('userDetail') && a.userDetail && a.userDetail.hasOwnProperty('name')){
            propertyA = a.userDetail.name.toUpperCase();
            propertyB = b.userDetail.name.toUpperCase();
        } else if(a instanceof CUserGroup) {
            propertyA = a.role.toUpperCase();
            propertyB = b.role.toUpperCase();
        } else{
            return 1;
        }
    }
    if(propertyA < propertyB){return -1;} if(propertyA > propertyB){return 1;} return 0;
}

/**
 * a callback to sort by id
 */
export function sortByIdFunction(a, b){
    let propertyA = parseInt(a.schedulerId);
    let propertyB = parseInt(b.schedulerId);
    if(propertyA < propertyB){return 1;} if(propertyA > propertyB){return -1;} return 0;
}

/**
 * to run callback on Enter event
 *
 * @param e - event
 * @param callback - callback that should be called
 */
export function onEnter(e, callback){
    if(e.key === 'Enter'){
        callback();
    }
}

/**
 * to check if image is valid or not
 *
 * @param image - image itself
 * @param onSuccess - on success callback
 * @param onFail - on fail callback
 */
export function checkImage(image, onSuccess, onFail){
    if(isString(image) && image !== '') {
        let img = new Image();
        img.onload = onSuccess;
        img.onerror = onFail;
        img.src = image;
    } else {
        onFail();
    }
}

/**
 * to shuffle array
 *
 * @param array - array itself
 */
export function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

/**
 * to focus on input by id
 *
 * @param id - id of the html element
 */
export function setFocusById(id){
    let element = document.getElementById(id);
    const inputs = ['input', 'select', 'button', 'textarea'];
    if (element) {
        let inputElement = null;
        if(inputs.indexOf(element.tagName.toLowerCase()) === -1){
            inputElement = element.querySelector('input');
        }
        if(inputElement) {
            setTimeout(() => {
                inputElement.focus();
            }, 100);
        } else{
            setTimeout(() => {
                element.focus();
            }, 100);
        }
    }
}

/**
 * to cut subarray and convert to string with separator
 *
 * @param arr - array
 * @param separator - separator for string
 * @param start - start index
 * @param end - end index
 */
export function subArrayToString(arr, separator, start = 0, end){
    if(!end) end = arr.length - 1;
    return arr.slice(start,end).join(separator);
}

/**
 * to clone Object
 *
 * @param obj - Object itself
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
 * console.log in debug mode
 *
 * @param value - value that should be consoled
 */
export function consoleLog(value){
    if(DEBUGGER_LOGS) {
        console.log(value);
    }
}
/**
 * console.error in debug mode
 *
 * @param value - value that should be consoled
 */
export function consoleError(value){
    if(DEBUGGER_ERRORS) {
        console.error(value);
    }
}

/**
 * to check if element is Number
 *
 * @param number - number itself
 */
export function isNumber(number){
    return !isNaN(parseInt(number));
}

/**
 * to check if element is ID
 *
 * @param id - id itself
 */
export function isId(id){
    let result = isNumber(id) && id > 0;
    return !!result;
}

/**
 * to check if element is Integer
 *
 * @param number - number
 */
export function isInteger(number) {
    Number.isInteger(number);
}

/**
 * to check if element is String
 *
 * @param str - String itself
 */
export function isString(str){
    return typeof str  === 'string';
}

/**
 * to check if String is in json format
 *
 * @param str - String itself
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
 * to check if an Object is empty
 *
 * @param obj - Object itself
 */
export function isEmptyObject(obj){
    if(isObject(obj)) {
        return Object.getOwnPropertyNames(obj).length === 0;
    }
    return false;
}

/**
 * to capitalize first character of the string
 *
 * @param string - String itself
 */
export function capitalize(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * to check if element is an Object
 *
 * @param obj - Object itself
 */
export function isObject (obj) {
    return obj && typeof obj === 'object' && obj.constructor === Object;
}

/**
 * to check if element is an Array
 *
 * @param array - Array itself
 */
export function isArray(array){
    return Array.isArray(array);
}

/**
 * to convert cron expression value in ScheduleList component
 *
 * @param cronExp - cron expression
 */
export function convertCronExpForSchedulerlist(cronExp){
    return cronExp;
}

/**
 * to convert time value in ScheduleList component
 *
 * @param t - time
 * @param mode - 'short' or 'full' format of time
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
 * to get classnames from the themes folder
 * if theme does not exist, then get default one
 *
 * @param authUser - current authorized user
 * @param classNames - a classname or an array of classnames
 * @param styles - an imported default css/scss file *
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
 * tp copy text to a clipboard
 *
 * @param text - text that is going to be copied
 */
export function copyStringToClipboard(text) {
    let el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

/**
 * to update object immutably
 *
 * @param obj - object itself
 * @param prop - property of the object
 * @param value - value for object's property
 */
export const updateObj = (obj, prop, value) => {
    let tmp = obj;
    tmp[prop] = value;
    return Object.assign({}, obj, tmp);
};

/**
 * to generate label that has key navigation
 *
 * @param title - title for label
 * @param index - index of the char in title that should be emphasized
 * @param classNames - keyNavigationTitle and keyNavigationLetter css classNames
 */
export function generateLabel(title, index, classNames = {keyNavigationTitle: 'key_navigation_title', keyNavigationLetter: 'key_navigation_letter'}){
    let startText = title.substr(0, index);
    let selectedLetter = title.charAt(index);
    let endText = title.substr(index + 1);
    return <span className={classNames.keyNavigationTitle}>{startText}<span className={classNames.keyNavigationLetter}>{selectedLetter}</span>{endText}</span>;
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
        if(connector.hasOwnProperty('icon')) {
            result.icon = mapInvoker(connector.icon);
        }
    }
    return result;
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