import ReactDOM from 'react-dom';
import {ResponseMessages} from "@requestInterface/application/IResponse";
const DEBUGGER_LOGS = true;
export function isNumber(number){
    return !isNaN(number);
}
export function consoleLog(value){
    if(DEBUGGER_LOGS) {
        console.log(value);
    }
}
export function isString(str){
    return typeof str  === 'string';
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
export function navigateTo(url){
    history.push('/');
    setTimeout(() => history.push(`/${url}`), 10);
}
export function stringToHTML(str) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body;
};

export function errorHandler(e){
    let result = e?.response?.data || null;
    if(!result){
        result = {
            message: e.message || ResponseMessages.NETWORK_ERROR,
        };
    }
    return result;
}