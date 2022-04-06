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

import {isArray, isString} from "@utils/app";
import {xml2js} from 'xml-js';
import CTag from "@classes/components/general/basic_components/xml_editor/CTag";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import {CBodyEditor} from "@classes/components/general/basic_components/CBodyEditor";

export default class CXmlEditor extends CBodyEditor{
    constructor(xml) {
        super();
        this._xml = isString(xml) ? xml2js(xml, {compact: true}) : xml;
        this._declaration = null;
        this._tag = null;
        this._lastEditElement = null;
        this.convertFromXml();
    }

    static updateFieldsBinding(connection, connector, method, xmlData){
        if(xmlData && xmlData.hasOwnProperty('existingValue')){
            if(xmlData.item instanceof CTag){
                for(let i = 0; i < xmlData.item.properties.length; i++){
                    if(xmlData.item.properties[i].isReference){
                        let newValue = xmlData.mode === 'remove' ? '' : xmlData.item.properties[i].value;
                        CBodyEditor.updateFieldsBinding(
                            connection,
                            connector,
                            method,
                            {
                                ...xmlData,
                                existingValue: xmlData.item.properties[i].value,
                                newValue,
                                namespaces: [...xmlData.namespaces, xmlData.name],
                                name: `@${xmlData.item.properties[i].name}`,
                                item: xmlData.item.properties[i]
                            }
                        );
                    }
                }
                if(isArray(xmlData.existingValue)){
                    for(let i = 0; i < xmlData.existingValue.length; i++){
                        let newValue = xmlData.mode === 'remove' ? '' : xmlData.existingValue[i].tags;
                        let lastNamespaceName = xmlData.name;
                        if(xmlData.arrayItemIndex !== -1){
                            lastNamespaceName += `[${xmlData.arrayItemIndex}]`;
                        }
                        CXmlEditor.updateFieldsBinding(
                            connection,
                            connector,
                            method,
                            {
                                ...xmlData,
                                existingValue: xmlData.existingValue[i].tags,
                                newValue,
                                namespaces: [...xmlData.namespaces, lastNamespaceName],
                                name: xmlData.existingValue[i].name,
                                item: xmlData.existingValue[i]
                            }
                        );
                    }
                }
            }
            CBodyEditor.updateFieldsBinding(connection, connector, method, xmlData);
        }
    }

    static getPlaceholder(){
        return '<?xml ... ?>';
    }

    static getClassName(params = {isDraft: false}){
        return params.isDraft ? 'method_body_xml_draft' : 'method_body_xml';
    }

    static hasImport(){
        return false;
    }

    static createXmlEditor(xml){
        return new CXmlEditor(xml);
    }

    static isAbsolute(){
        return false;
    }

    static getParent(){
        return null;
    }

    static setLastEditElement(item, value, prevValue, mode){
        let namespaces = [];
        let parent = null;
        let name = '';
        let prevItemIndex = '';
        let arrayItemIndex = -1;
        if(item instanceof CTag || item instanceof CProperty) {
            name = item instanceof CProperty ? `@${item.name}` : item.name;
            if(item.parent) {
                parent = item.parent;
                if(item.isArray && parent){
                    let arrayItem = parent.tags.filter(tag => tag.name === item.name);
                    arrayItemIndex = arrayItem.findIndex(elem => elem.uniqueIndex === item.uniqueIndex);
                }
                while (true) {
                    let namespaceItem = '';
                    let prevItemArrayIndex = '';
                    if(!(parent instanceof CXmlEditor)){
                        namespaceItem = parent instanceof CProperty ? `@${parent.name}` : parent.name;
                        if(namespaces.length > 0 && prevItemIndex !== ''){
                            let prevItem = parent.tags.find(tag => tag.uniqueIndex === prevItemIndex);
                            if(prevItem){
                                let prevItemArray = parent.tags.filter(tag => tag.name === prevItem.name);
                                if(prevItem.isArray){
                                    prevItemArrayIndex = prevItemArray.findIndex(p => p.uniqueIndex === prevItemIndex);
                                    if(prevItemArrayIndex !== -1){
                                        namespaces[0] = `${namespaces[0]}[${prevItemArrayIndex}]`
                                    }
                                }
                            }
                        }
                        namespaces.unshift(namespaceItem);
                        if (!parent.parent) {
                            break;
                        } else {
                            prevItemIndex = parent.uniqueIndex;
                            parent = parent.parent;
                        }
                    } else{
                        break;
                    }
                }
            }
        }
        if(parent){
            parent.lastEditElement = {
                namespaces,
                value,
                prevValue,
                name,
                mode,
                item,
                arrayItemIndex,
            };
        }
    }

    static convertToBodyFormat(bodyData){
        return bodyData.convertToBackendXml();
    }

    static convertForFieldBinding(xmlEditor){
        let lastEditElement = xmlEditor.lastEditElement;
        if(lastEditElement) {
            return {
                namespaces: lastEditElement.namespaces,
                newValue: lastEditElement.value,
                name: lastEditElement.name,
                existingValue: lastEditElement.prevValue,
                item: lastEditElement.item,
                mode: lastEditElement.mode,
                arrayItemIndex: lastEditElement.arrayItemIndex,
            };
        }
        return null;
    }

    convertFromXml(){
        if(this._xml.hasOwnProperty('_declaration')){
            this._declaration = CTag.createTag('xml', this._xml._declaration, this);
        }
        for(let node in this._xml){
            if(node !== '_declaration'){
                this._tag = CTag.createTag(node, this._xml[node], this, this._xml);
                break;
            }
        }
    }

    removeCoreTag(){
        this._tag = null;
    }

    removeDeclaration(){
        this._declaration = null;
    }

    get xml(){
        return this._xml;
    }

    get declaration(){
        return this._declaration;
    }

    addDeclaration(){
        this._declaration = new CTag('xml', null, {}, this);
    }

    get tag(){
        return this._tag;
    }

    addTag(name, tags){
        this._tag = new CTag(name, tags, {}, this, this._xml);
        return this._tag;
    }

    set lastEditElement(lastEditElement){
        this._lastEditElement = lastEditElement;
    }

    get lastEditElement(){
        return this._lastEditElement;
    }

    convertDeclaration(){
        if(this._declaration) {
            return `<?xml ${this._declaration.properties.map(property => property.convertToXml()).join(' ')} ?>`;
        }
        return '';
    }

    convertToXml(settings = {}){
        const {hasFormat} = settings;
        let xmlString = this.convertDeclaration();
        if(this._tag) {
            if (hasFormat || typeof hasFormat === 'undefined') {
                const coreTag = this._tag.convertToXml(settings);
                xmlString += `\n${coreTag}`;
            } else {
                const coreTag = this._tag.convertToXml(settings);
                xmlString += `${coreTag}`;
            }
        }
        return xmlString;
    }

    convertToBackendXml(){
        let backendXml = {};
        if(this._tag) {
            backendXml[this._tag.name] = this._tag.convertToBackendXml();
        } else{
            backendXml = null;
        }
        return backendXml;

    }
}