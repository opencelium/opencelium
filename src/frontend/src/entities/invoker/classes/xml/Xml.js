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

import {js2xml} from 'xml-js';
import {Invoker} from "../Invoker";
import CXmlInvoker from "./CXmlInvoker";

/**
 * Xml class
 */
export default class Xml{
    constructor(className, attributes, element){
        this._className = className;
        if(attributes) {
            this._attributes = attributes;
        }
        this._element = this.convertElement(element);
    }

    static createXml(data){
        let className = data && data.hasOwnProperty('className') ? data.className : '';
        let attributes = data && data.hasOwnProperty('attributes') ? data.attributes : null;
        let element = data && data.hasOwnProperty('element') ? data.element : null;
        return new Xml(className, attributes, element);
    }

    convertElement(element){
        switch(this._className){
            case 'invoker':
                if(!(element instanceof Invoker)){
                    element = Invoker.createInvoker(element);
                }
                element = CXmlInvoker.createInvoker(element);
                break;
            default:
                break;
        }
        return element;
    }

    generateXmlString(){
        return js2xml(this.getObject(), {compact: true, spaces: 4});
    }

    getObject(){
        let obj = {};
        if(this._attributes){
            obj._attributes = this._attributes;
        }
        if(this._element) {
            obj[this._className] = this._element.getObject();
        }
        return obj;
    }
}