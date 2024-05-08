/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import ReactDOM from 'react-dom';
import ReactDOMServer from "react-dom/server";
import React, {ReactElement, useEffect, useRef} from "react";
import _ from "lodash";
import {ResponseMessages} from "../requests/interfaces/IResponse";
import {Application} from "../classes/Application";
import crypto from "crypto";
import {Range} from "ace-builds";

//TODO rename utils.js into utils.tsx
/**
 * to check if element is ID
 *
 * @param id - id itself
 */
export function isId(id){
    let result = isNumber(id) && id > 0;
    return !!result;
}
export function findTopLeftPosition(elem) {
    if(typeof elem  === 'string'){
        elem = document.getElementById(elem);
    }
    if(elem) {
        elem = ReactDOM.findDOMNode(elem);
        let rec = elem.getBoundingClientRect();
        return {top: rec.top + window.scrollY, left: rec.left + window.scrollX};
    } else{
        return {top: 0, left: 0};
    }
}

export async function convertPngUrlToBase64(url){
    try {
        const data = await fetch(url);
        const blob = await data.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                resolve(base64data);
            }
        });
    } catch(e){
        return null;
    }
}

export function getActionWithoutType(actionName){
    let splitActionName = actionName.split('/');
    return splitActionName.slice(0, splitActionName.length - 1).join('/');
}

export function resizeWindow(){
    window.dispatchEvent(new Event('resize'));
}

export function isValidIconUrl(icon){
    return isString(icon) && icon !== '' && icon.substr(icon.length - 5) !== '/null';
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
 * to copy text to a clipboard
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

export function isString(str){
    return typeof str  === 'string';
}

export function capitalize(string){
    return string.toString().charAt(0).toUpperCase() + string.toString().slice(1);
}

export function cleanString(str){
    return str.toLowerCase().trim();
}

export function useEventListener(eventName, handler, element = window, hasListener = false){
    const savedHandler= useRef();
    const eventListener = (event) => savedHandler.current(event);
    if(!hasListener){
        element.removeEventListener(eventName, eventListener);
    }
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);
    useEffect(
        () => {
            const isSupported = element && element.addEventListener;
            if (!isSupported) return;
            if(hasListener) {
                element.addEventListener(eventName, eventListener);
            }
            return () => {
                element.removeEventListener(eventName, eventListener);
            };
        },
        [eventName, element, hasListener]
    );
}

export function getFocusableElements(elem){
    if(elem) {
        return elem.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }
    return [];
}

export function reactElementToText(node) {
    return ReactDOMServer.renderToString(node);
}


const DEBUGGER_LOGS = false;
export function isNumber(number){
    return !isNaN(number);
}
export function consoleLog(value){
    if(DEBUGGER_LOGS) {
        console.log(value);
    }
}
export function isArray(array){
    return Array.isArray(array);
}

export function removeFromArrayByValue(array, value){
    let index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index, 1);
    }
    return [...array];
}
export function isObject (obj) {
    return obj && typeof obj === 'object' && obj.constructor === Object;
}
export function isEmptyObject(obj){
    if(isObject(obj)) {
        return Object.getOwnPropertyNames(obj).length === 0;
    }
    return false;
}

export function putSpaceInCamelWords(str){
    return str.replace(/([A-Z])/g, ' $1');
}


export function onEnter(e, callback) {
    if (e.key === 'Enter') {
        callback();
    }
}
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

export function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);

    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}
export function stringToHTML(str) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body;
};

export function errorHandler(e){
    return {
        message: e?.response?.data?.message || e?.message || ResponseMessages.NETWORK_ERROR,
    };
}

export function deepObjectsMerge(object, sources){
    return _.merge(object, sources);
}



export const VIEW_TYPE = {
    LIST: 'LIST',
    GRID: 'GRID',
};
/**
 * flag for debugging in console
 */
export const DEBUGGER_ERRORS = true;

/**
 * messages from backend if token was expired
 */
export const TOKEN_EXPIRED_MESSAGES = ['TOKEN_EXPIRED', 'Access Denied', 'UNSUPPORTED_HEADER_AUTH_TYPE'];

export function checkCronExpression(cronExp){
    const timeParts = cronExp.split(' ');
    let timePartsLength = timeParts.length;
    if(timePartsLength > 0){
        if(timeParts[timePartsLength - 1] === ''){
            timePartsLength--;
            cronExp = cronExp.substr(0, cronExp.length - 1);
        }
    }
    const secRegExp = timePartsLength > 0 ? `^(([1-5]?[0-9])|\\,|\\-|/|\\*)*` : '';
    const minRegExp = timePartsLength > 1 ? ` (([1-5]?[0-9])|\\,|\\-|/|\\*)*` : '';
    const hourRegExp = timePartsLength > 2 ? ` (([0-1]?[0-9])|20|21|22|23|\\,|\\-|/|\\*)*` : '';
    const dayRegExp = timePartsLength > 3 ? ` (\\?|([0-2]?[0-9])|30|31|L|W|\\,|\\-|/|\\*)*` : '';
    const monthRegExp = timePartsLength > 4 ? ` (([0-9])|([A-Z])|10|11|\\,|\\-|/|\\*)*` : '';
    const dayOfWeekRegExp = timePartsLength > 5 ? ` (([0-7])|([A-Z])|L|#|\\,|\\-|/|\\?|\\*)*` : '';
    const yearRegExp = timePartsLength > 6 ? ` (([0-9]*)|\\,|\\-|/|\\*)*` : '';
    const cronRegExp = new RegExp(`${secRegExp}${minRegExp}${hourRegExp}${dayRegExp}${monthRegExp}${dayOfWeekRegExp}${yearRegExp}`+ '$');
    return cronRegExp.test(cronExp);
}

export function checkExpiredMessages(data){
    let result = false;
    if(isString(data)){
        result = TOKEN_EXPIRED_MESSAGES.indexOf(data) !== -1;
    } else{
        if(data && data.hasOwnProperty('message')){
            result = TOKEN_EXPIRED_MESSAGES.indexOf(data.message) !== -1;
        }
        if(!result && data && data.hasOwnProperty('response') && data.response && data.response.hasOwnProperty('message')){
            result = TOKEN_EXPIRED_MESSAGES.indexOf(data.response.message) !== -1;
        }
    }
    return result;
}

export function setFocusByCaretPositionInDivEditable(elem, caretPosition){
    if(elem && caretPosition >= 0) {
        let range = document.createRange();
        let sel = window.getSelection();
        let childNodeIndex = 0;
        let elemLength = 0;
        for(let i = 0; i < elem.children.length; i++){
            caretPosition -= elem.children[i].innerText.length;
            elemLength += elem.children[i].innerText.length;
            if(caretPosition <= 0){
                caretPosition = elem.children[i].innerText.length + caretPosition;
                break;
            }/*
            if(caretPosition === 0) {
                range.selectNodeContents(elem);
                range.collapse(false); // Collapse range to the end
                sel.removeAllRanges();
                sel.addRange(range);
                return;
            }*/
            childNodeIndex++;
        }
        const childNode = elem.childNodes[childNodeIndex];
        if(childNode) {
            if (childNode.nodeType === 1) {
                if (caretPosition <= childNode.firstChild.length) {
                    range.setStart(childNode.firstChild, caretPosition);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    //elem.focus();
                } else {
                    return;
                }
            } else {
                if (caretPosition <= childNode.length) {
                    range.setStart(childNode, caretPosition);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    //elem.focus();
                } else {
                    return;
                }
            }
        } else{
            return;
        }
    }
}

export function getCaretPositionOfDivEditable(editableDiv) {
    let caretOffset = 0;
    if (window.getSelection) {
        let range = window.getSelection().getRangeAt(0);
        let preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editableDiv);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    }

    else if (document.selection && document.selection.type != "Control") {
        let textRange = document.selection.createRange();
        let preCaretTextRange = document.body.createTextRange();
        preCaretTextRange.moveToElementText(editableDiv);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }

    return caretOffset;
}

/**
 * to replace &amp to amp in the text
 * @param innerText - should be free html text
 */
export function freeStringFromAmp(innerText){
    const div = document.createElement('div');
    if(div){
        div.innerHTML = innerText;
        if(div.firstChild) {
            return div.firstChild.nodeValue;
        }
    }
    return innerText;
}

/**
 * to check the references format in connections
 */
export function checkReferenceFormat(value, isStrict = false){
    let result = false;
    let pointers = [];
    let counter = 0;
    if(value !== '#' && typeof value === 'string') {
        pointers = value.split(';');
        if(pointers.length > 0) {
            for(let i = 0; i < pointers.length; i++) {
                let pointer = pointers[i];
                let splitPointer = pointer.split('.');
                if (splitPointer.length > 3) {
                    if (splitPointer[0][0] === '#') {
                        if (splitPointer[0].length === 7) {
                            if (splitPointer[1].substring(1, splitPointer[1].length - 1) === 'response'
                                || splitPointer[1].substring(1, splitPointer[1].length - 1) === 'request') {
                                if (splitPointer[2] === 'success' || splitPointer[2] === 'fail') {
                                    if (splitPointer[3].length > 0) {
                                        result = true;
                                        counter++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } else{
        if(value === '#' && !isStrict){
            result = true;
        } else{
            result = false;
        }
    }
    if(result && counter === pointers.length){
        return true;
    } else{
        return false;
    }
}

/**
 * to get top and left value of the element according to window
 */
export function findTopLeft(elem) {
    if(isString(elem)){
        elem = document.getElementById(elem);
    }
    if(elem) {
        let rec = elem.getBoundingClientRect();
        return {top: rec.top + window.scrollY, left: rec.left + window.scrollX};
    } else{
        return {top: 0, left: 0};
    }
}

/**
 * to format html id
 *
 * @param id - id of the html element
 */
export function formatHtmlId(id){
    if(isString(id)) {
        return id.replace(' ', '_').toLowerCase().trim();
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

export function sleepApp(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
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
 * to check if image is valid or not
 *
 * @param image - image itself
 * @param onSuccess - on success callback
 * @param onFail - on fail callback
 */
export function checkImage(image, onSuccess, onFail){
    if(Application.isValidImageUrl(image)) {
        let img = new Image();
        img.onload = onSuccess;
        img.onerror = onFail;
        img.src = image;
    } else {
        onFail();
    }
}

/**
 * to show component setting opacity to 1
 *
 * @param elementId - id of the html element
 */
export function componentAppear(elementId){
    setTimeout(function(){
        const element = document.getElementById(elementId);
        if(element !== null) {
            element.style.opacity = 1;
        }
    }, 500);
}
/*
/!**
 * to merge two objects deeply
 *
 * @param target - target object
 * @param source - source object
 *!/
export function deepObjectsMerge(target, source){
    // Iterate through `source` properties and if an `Object` set property to merge of `target` and `source` properties
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object) Object.assign(source[key], deepObjectsMerge(target[key], source[key]))
    }

    // Join `target` and modified `source`
    Object.assign(target || {}, source)
    return target
}*/

/**
 * to compare two arrays values
 *
 * @param arr1 - first array
 * @param arr2 - second array
 */
function compareArrays(arr1, arr2){
    return _.isEqual(_.sortBy(arr1), _.sortBy(arr2))
}


/**
 * to compare two objects' params on equality
 *
 * @param obj1 - first object
 * @param obj2 - second object
 */
export function isEqualObjectParams(obj1, obj2){
    let result = false;
    let obj1Keys = _.sortBy(Object.keys(obj1));
    let obj2Keys = _.sortBy(Object.keys(obj2));
    if(compareArrays(obj1Keys, obj2Keys)){
        let hasObjects = false;
        for(let param in obj1){
            if(_.isPlainObject(obj1[param]) && _.isPlainObject(obj2[param])){
                result = isEqualObjectParams(obj1[param], obj2[param]);
                hasObjects = true;
            } else{
                if((_.isPlainObject(obj1[param]) && !_.isPlainObject(obj2[param])) ||
                    !_.isPlainObject(obj1[param]) && _.isPlainObject(obj2[param])){
                    return false;
                }
            }
        }
        if(!hasObjects){
            result = true;
        }
    }
    return result;
}


/**
 * to focus on input by id
 *
 * @param id - id of the html element
 * @param timeout - timout before focus
 */
export function setFocusById(id, timeout = 100){
    setTimeout(() => {
        let element = document.getElementById(id);
        const inputs = ['input', 'select', 'button', 'textarea'];
        if (element) {
            let inputElement = null;
            if(inputs.indexOf(element.tagName.toLowerCase()) === -1){
                inputElement = element.querySelector('input');
            }
            if(inputElement) {
                inputElement.focus();
            } else{
                element.focus();
            }
        }
    }, timeout);
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
 * console.error in debug mode
 *
 * @param value - value that should be consoled
 */
export function consoleError(value){
    if(DEBUGGER_ERRORS) {
        console.error(value);
    }
}

export function checkXmlTagFormat(tagName){
    if(isNumber(tagName[0])){
        alert('Name cannot start with a number');
        return false;
    }
    if(tagName.substring(0, 3) === 'xml'){
        alert('Name cannot start with \'xml\'');
        return false;
    }
    if(!tagName[0].toLowerCase().match(/[a-z]/i)){
        if(tagName[0] !== '_') {
            alert('Name should start from letter or underscore');
            return false
        }
    }
    return true;
}

/**
 * to check if element is Integer
 *
 * @param number - number
 */
export function isInteger(number) {
    Number.isInteger(number);
}

function isClassComponent(component) {
    return (
        typeof component === 'function' &&
        !!component.prototype.isReactComponent
    )
}

function isFunctionComponent(component) {
    return (
        typeof component === 'function' &&
        String(component).includes('return React.createElement')
    )
}

export function isReactComponent(component) {
    return (
        isClassComponent(component) ||
        isFunctionComponent(component)
    )
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
 * to convert cron expression value in ScheduleList component
 *
 * @param cronExp - cron expression
 */
export function convertCronExpForSchedulerlist(cronExp){
    return cronExp;
}

/**
 * to convert time for cron expression
 *
 * @param timeStamp - time
 */
export function convertTimeForCronExpression(timeStamp){
    let date = new Date(timeStamp);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let dateValue = date.getDate();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let day = date.getDay();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    seconds = seconds < 10 ? '0'+seconds : seconds;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    hours = hours < 10 ? '0'+hours : hours;
    dateValue = dateValue < 10 ? '0'+dateValue : dateValue;
    month = month < 10 ? '0'+month : month;
    return <span><span style={{width: '60px', display: 'inline-block', textAlign: 'right'}}>{`${hours}:${minutes}:${seconds}`}</span><span style={{width: '45px', display: 'inline-block'}}>{days[day]}</span><span style={{width: '55px', display: 'inline-block'}}>{`${dateValue}.${month}.${year}`}</span></span>;
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
 * to get text from a clipboard
 */
export function getStringFromClipboard() {
    try {
        var pasteTarget = document.createElement("div");
        pasteTarget.contentEditable = true;
        var actElem = document.activeElement.appendChild(pasteTarget).parentNode;
        pasteTarget.focus();
        document.execCommand("Paste", null, null);
        var paste = pasteTarget.innerText;
        actElem.removeChild(pasteTarget);
        return paste;
    } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
    }
}
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

export function sortConnectorItemIndexes(indexes){
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    return indexes.sort((a, b) => {
        return a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }, collator);
}

export const convertFileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

export const debounce = (callback, wait = 500) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(this, args), wait);
    };
}

export const generateSignature = (token, method, url, timestamp) => {
    const hmac = crypto.createHmac('SHA256', token);
    hmac.update(`${method.toUpperCase()}${url}${timestamp}`);
    return hmac.digest('hex');
}

export const sortAlphabeticallyByKey = (array, key) => {
    return array.sort(function(a, b) {
        const x = a[key].toLowerCase();
        const y = b[key].toLowerCase();
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

export const getMarker = (editor, value, searchString) => {
    const matches = [...value?.matchAll(`\\${searchString}`)];
    let result = [];
    for(let i = 0; i < matches.length; i++){
        if (matches[i]?.index) {
            const start = editor.session.doc.indexToPosition(matches[i].index);
            const end = editor.session.doc.indexToPosition(matches[i].index + searchString.length);
            result.push({
                startRow: start.row,
                startCol: start.column,
                endRow: end.row,
                endCol: end.column,
                className: "error-ace-marker",
                type: "text",
            });
        }
    }
    return result;
}
export const positionElementOver = (targetElementIds, offset, hide) => {
    if(!document.getElementById('wrapActiveElementId')){
        let div = document.createElement('div');
        div.setAttribute('id', 'wrapActiveElementId');
        div.style = 'border: 2px solid #fd9843; border-radius: 4px; z-index: 10001; display: none; box-shadow: 0px 0px 5px 0px #fd9843 inset;';

        document.body.appendChild(div);
    }

    let element = document.getElementById('wrapActiveElementId');
    if(element){
        let targetElements = targetElementIds.map(function(id) {
            if(id){
                return document.getElementById(id);
            }
        });

        if(targetElements){
            let targetRects = targetElements.map(function(targetElement) {
                if(targetElement){
                    return targetElement.getBoundingClientRect();
                }
            });

            let parentRect = element.parentElement.getBoundingClientRect();

            if(targetRects && parentRect){
                let top = Math.max.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.top - parentRect.top;
                    }
                }));

                let left = Math.min.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.left - parentRect.left;
                    }
                }));

                let width = Math.max.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.left - parentRect.left + rect.width;
                    }
                })) - left;

                let height = Math.max.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.top - parentRect.top + rect.height;
                    }
                })) - top;

                top -= offset / 2;
                left -= offset / 2;

                element.style.position = 'absolute';
                element.style.display = 'block';
                element.style.top = top + 'px';
                element.style.left = left + 'px';
                element.style.width = width + 10 + 'px';
                element.style.height = height + 5 + 'px';
                element.style.padding = offset + 'px';

                if(hide){
                    element.style.display = 'none'
                }
            }
        }
    }
}

export const positionElementOverByClassName = (targetElementsClasses, offset, hide) => {
    if(!document.getElementById('wrapActiveElement')){
        let div = document.createElement('div');
        div.setAttribute('id', 'wrapActiveElement');
        div.style = 'border: 2px solid #fd9843; border-radius: 4px; z-index: 10001; display: none; box-shadow: 0px 0px 5px 0px #fd9843 inset;';

        document.body.appendChild(div);
    }

    let element = document.getElementById('wrapActiveElement');
    if(element){
        let targetElements = targetElementsClasses.map(function(className) {
            const el = document.querySelectorAll(className);
            if(el){
                for(let i = 0; i < el.length; i++) {
                    let computedStyle = window.getComputedStyle(el[i]);
                    if(computedStyle.display !== 'none') {
                        return el[i];
                    }
                }
            }
        });

        if(targetElements){
            let targetRects = targetElements.map(function(targetElement) {
                if(targetElement){
                    return targetElement.getBoundingClientRect();
                }
            });

            let parentRect = element.parentElement.getBoundingClientRect();

            if(targetRects && parentRect){
                let top = Math.max.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.top + Math.abs(parentRect.top);
                    }
                }));

                let left = Math.min.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.left - parentRect.left;
                    }
                }));

                let width = Math.max.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.left - parentRect.left + rect.width;
                    }
                })) - left;

                let height = Math.max.apply(null, targetRects.map(function(rect) {
                    if(rect){
                        return rect.top - parentRect.top + rect.height;
                    }
                })) - top;

                top -= offset / 2;
                left -= offset / 2;

                element.style.position = 'absolute';
                element.style.display = 'block';
                element.style.top = top + 'px';
                element.style.left = left + 'px';
                element.style.width = width + 10 + 'px';
                element.style.height = height + 8 + 'px';
                element.style.padding = offset + 'px';

                if(hide){
                    element.style.display = 'none'
                }
            }
        }
    }
}

export function replaceVariables(code, variableMap) {
    // Create a regular expression pattern to match variables
    const variablePattern = /(\b[a-zA-Z_][a-zA-Z0-9_]*)\b/g;

    // Use the replace method with a callback function
    const replacedCode = code.replace(variablePattern, (match, variable) => {
        // Check if the variable exists in the variableMap
        if (variableMap.hasOwnProperty(variable)) {
            // Replace the variable with its corresponding value
            return variableMap[variable];
        } else {
            // If the variable is not found in the variableMap, leave it unchanged
            return match;
        }
    });

    return replacedCode;
}
