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

import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import {copyStringToClipboard, isArray, isString} from "@utils/app";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";

export const TAG_VALUE_TYPES = {
    EMPTY: 'EMPTY',
    TEXT: 'TEXT',
    ITEM: 'ITEM',
    CLIPBOARD: 'CLIPBOARD'
};

const TAB_CHAR = '    ';
const BACKEND_ATTRIBUTE_PROPERTY = '__oc__attributes';
const BACKEND_VALUE_PROPERTY = '__oc__value';

export default class CTag{
    constructor(name, tags, properties = {}, parent = null, xml = null) {
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._name = name;
        this._tags = tags;
        this._properties = this.convertProperties(properties);
        this._minimized = false;
        this._valueType = this.getValueType();
        this._parent = parent;
        this._xml = xml;
        this._isArray = this.getIsArray();
    }

    static createTag(name = '', node = null, parent = null, xml = null){
        let tags = [];
        let attributes = {};
        let newTag = new CTag(name);
        if(node){
            let nodeValue = null;
            if(node.hasOwnProperty(BACKEND_VALUE_PROPERTY)){
                nodeValue = node[BACKEND_VALUE_PROPERTY];
            } else if(node.hasOwnProperty('_text')){
                nodeValue = node._text;
            }
            if(node.hasOwnProperty(BACKEND_ATTRIBUTE_PROPERTY))
                attributes = node[BACKEND_ATTRIBUTE_PROPERTY];
            else if(node.hasOwnProperty('_attributes')){
                attributes = node._attributes;
            }
            if(nodeValue !== null){
                tags = nodeValue;
            } else {
                for (let subNode in node) {
                    if (subNode !== BACKEND_ATTRIBUTE_PROPERTY && subNode !== '_attributes' && subNode !== BACKEND_VALUE_PROPERTY && subNode !== '_text') {
                        if(isArray(node[subNode])){
                            for(let i = 0; i < node[subNode].length; i++){
                                tags.push(CTag.createTag(subNode, node[subNode][i], newTag, xml));
                            }
                        } else {
                            tags.push(CTag.createTag(subNode, node[subNode], newTag, xml));
                        }
                    }
                }
            }
        }
        if(tags.length === 0){
            tags = null;
        }
        newTag.properties = attributes;
        newTag.tags = tags;
        newTag.parent = parent;
        newTag.xml = xml;
        if(parent instanceof CXmlEditor){
            newTag.updateIsArrayItem();
        }
        return newTag;
    }

    getIsArray(){
        let result = false;
        if(this._xml){
            let path = [this.name];
            let parent = this._parent;
            while(true){
                if(parent && !(parent instanceof CXmlEditor)){
                    path.unshift(parent.name);
                    parent = parent.parent;
                } else{
                    break;
                }
            }
            let xmlItem = this._xml;
            for(let i = 0; i < path.length; i++){
                if(xmlItem.hasOwnProperty(path[i])){
                    xmlItem = xmlItem[path[i]];
                } else{
                    if(isArray(xmlItem) && xmlItem.length > 0){
                        xmlItem = xmlItem[0][path[i]];
                    }
                    break;
                }
            }
            if(isArray(xmlItem)){
                result = true;
            }
        }
        return result;
    }

    updateIsArrayItem(){
        this._isArray = this.getIsArray();
        if(isArray(this._tags)) {
            for (let i = 0; i < this._tags.length; i++) {
                this._tags[i].updateIsArrayItem();
            }
        }
    }

    convertProperties(properties){
        let convertedProperties = [];
        for(let property in properties){
            convertedProperties.push(CProperty.createProperty(property, properties[property], this));
        }
        return convertedProperties;
    }

    getValueType(){
        if(isArray(this._tags)){
            return TAG_VALUE_TYPES.ITEM;
        }
        if(isString(this._tags)){
            return TAG_VALUE_TYPES.TEXT;
        }
        return TAG_VALUE_TYPES.EMPTY;
    }

    set xml(xml){
        this._xml = xml;
        this._isArray = this.getIsArray();
    }

    get name(){
        return this._name;
    }

    get tags(){
        return this._tags;
    }

    set tags(tags){
        this._tags = tags;
        this._valueType = this.getValueType();
    }

    addTag(nameOrTag, tags){
        if(nameOrTag instanceof CTag){
            this.tags.push(nameOrTag);
        } else {
            const newTag = new CTag(nameOrTag, tags, {}, this, this._xml);
            if (isArray(this._tags)) {
                this._tags.push(newTag);
            } else {
                this._tags = [newTag];
            }
        }
        this._valueType = this.getValueType();
        return this.tags[this.tags.length - 1];
    }

    updateTag(nameOrTag, tags){
        if(nameOrTag instanceof CTag){
            this._name = nameOrTag.name;
            this._tags = nameOrTag.tags;
            this._properties = nameOrTag.properties;
        } else {
            this._name = nameOrTag;
            this._tags = tags;
        }
        this._valueType = this.getValueType();
    }

    removeTag(index){
        if(index !== -1) {
            this._tags.splice(index, 1);
        }
    }

    get properties(){
        return this._properties;
    }

    set properties(properties){
        this._properties = this.convertProperties(properties);
    }

    addProperty(property){
        let index = this._properties.findIndex(p => p.name === property.name);
        if(index === -1) {
            this._properties.push(property);
            return true;
        }
        return false;
    }

    removeProperty(name){
        let index = this._properties.findIndex(p => p.name === name);
        if(index !== -1) {
            this._properties.splice(index, 1);
        }
    }

    get uniqueIndex(){
        return this._uniqueIndex;
    }

    get minimized(){
        return this._minimized;
    }

    set minimized(minimized){
        this._minimized = minimized;
    }

    get valueType(){
        return this._valueType;
    }

    set valueType(valueType){
        if(TAG_VALUE_TYPES.hasOwnProperty(valueType)){
            this._valueType = valueType;
        }
        consoleError('Such tag value type does not exist');
    }

    getNamespaces(){
        let namespaces = [];
        let parent = this._parent;
        let prevIndex = this._uniqueIndex;
        let isPrevItemArray = this.isArray;
        while(true){
            if(isPrevItemArray && namespaces.length > 0){
                let index = parent.tags.findIndex(tag => tag._uniqueIndex === prevIndex);
                namespaces[0] += `[${index}]`;
            }
            namespaces.unshift(parent.name);
            if(parent instanceof CXmlEditor) {
                break;
            }
            prevIndex = parent._uniqueIndex;
            isPrevItemArray = parent.isArray;
            parent = parent.parent;
        }
        return namespaces;
    }

    get parent(){
        return this._parent;
    }

    set parent(parent){
        this._parent = parent;
        this._isArray = this.getIsArray();
    }

    get isArray(){
        return this._isArray;
    }

    copyToClipboard(){
        copyStringToClipboard(this.convertToXml());
    }

    convertPropertiesToXml(){
        if(this._properties.length !== 0) {
            return ' ' + this._properties.map(property => property.convertToXml()).join(' ');
        }
        return '';
    }

    convertToXml(settings = {}){
        let {hasFormat, indent} = settings;
        if(typeof hasFormat === 'undefined'){
            hasFormat = true;
        }
        if(typeof indent === 'undefined'){
            indent = 1;
        }
        let startTag = `<${this._name}${this.convertPropertiesToXml()}`;
        let items = '';
        let endTag = '';
        switch(this._valueType){
            case TAG_VALUE_TYPES.EMPTY:
                startTag += '/>';
                break;
            case TAG_VALUE_TYPES.TEXT:
                startTag += '>';
                items = this._tags;
                endTag = `</${this._name}>`;
                break;
            case TAG_VALUE_TYPES.ITEM:
                if(this._tags.length === 0){
                    startTag += `/>`;
                } else {
                    startTag += `>${hasFormat ? '\n' : ''}`;
                    items = this._tags.map(t => `${hasFormat ? TAB_CHAR.repeat(indent) : ''}${t.convertToXml({
                        hasFormat,
                        indent: indent + 1
                    })}`).join(`${hasFormat ? '\n' : ''}`);
                    endTag = `${hasFormat ? '\n' + TAB_CHAR.repeat(indent - 1) : ''}</${this._name}>`;
                }
                break;
        }
        return `${startTag}${items}${endTag}`;
    }

    convertToBackendXml(){
        let tag = {};
        if(this._properties.length > 0){
            for(let i = 0; i < this._properties.length; i++){
                if(tag.hasOwnProperty(BACKEND_ATTRIBUTE_PROPERTY)) {
                    tag[BACKEND_ATTRIBUTE_PROPERTY] = {...tag[BACKEND_ATTRIBUTE_PROPERTY], ...this._properties[i].convertToBackendXml()};
                } else{
                    tag[BACKEND_ATTRIBUTE_PROPERTY] = this._properties[i].convertToBackendXml();
                }
            }
        } else{
            tag[BACKEND_ATTRIBUTE_PROPERTY] = null;
        }
        switch(this._valueType){
            case TAG_VALUE_TYPES.EMPTY:
                tag[BACKEND_VALUE_PROPERTY] = null;
                break;
            case TAG_VALUE_TYPES.TEXT:
                tag[BACKEND_VALUE_PROPERTY] = this._tags;
                break;
            case TAG_VALUE_TYPES.ITEM:
                for(let i = 0; i < this._tags.length; i++){
                    if(tag.hasOwnProperty(this._tags[i].name)) {
                        if(!isArray(tag[this._tags[i].name])) {
                            tag[this._tags[i].name] = [tag[this._tags[i].name]];
                        }
                        tag[this._tags[i].name].push(this._tags[i].convertToBackendXml());
                    } else{
                        if(this._tags[i].isArray){
                            tag[this._tags[i].name] = [this._tags[i].convertToBackendXml()];
                        } else{
                            tag[this._tags[i].name] = this._tags[i].convertToBackendXml();
                        }
                    }
                }
                break;
        }
        return tag;
    }
}