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

import ReactDOM from 'react-dom';
import {useEffect, useRef} from "react";

export function findTopLeftPosition(elem: any) {
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

export function getActionWithoutType(actionName: string): string{
    let splitActionName = actionName.split('/');
    return splitActionName.slice(0, splitActionName.length - 1).join('/');
}

export function resizeWindow(){
    window.dispatchEvent(new Event('resize'));
}

export function isValidIconUrl(icon: string){
    return isString(icon) && icon !== '' && icon.substr(icon.length - 5) !== '/null';
}

/**
 * to shuffle array
 *
 * @param array - array itself
 */
export function shuffle(array: any[]) {
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
export function copyStringToClipboard(text: string) {
    let el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

export function isString(str: any){
    return typeof str  === 'string';
}

export function capitalize(string: string | number | symbol){
    return string.toString().charAt(0).toUpperCase() + string.toString().slice(1);
}

export function cleanString(str: string){
    return str.toLowerCase().trim();
}

export function useEventListener(eventName: string, handler: any, element = window, hasListener = false): void{
    // Create a ref that stores handler
    const savedHandler:any = useRef();
    const eventListener = (event: any) => savedHandler.current(event);
    // Update ref.current value if handler changes.
    // This allows our effect below to always get latest handler ...
    // ... without us needing to pass it in effect deps array ...
    // ... and potentially cause effect to re-run every render.
    if(!hasListener){
        element.removeEventListener(eventName, eventListener);
    }
    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);
    useEffect(
        () => {
            // Make sure element supports addEventListener
            // On
            const isSupported = element && element.addEventListener;
            if (!isSupported) return;
            // Create event listener that calls handler function stored in ref
            // Add event listener
            if(hasListener) {
                element.addEventListener(eventName, eventListener);
            }
            // Remove event listener on cleanup
            return () => {
                element.removeEventListener(eventName, eventListener);
            };
        },
        [eventName, element, hasListener] // Re-run if eventName or element changes
    );
}


export function getFocusableElements(elem: any = document): HTMLElement[]{
    if(elem) {
        return elem.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }
    return [];
}