import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import {copyStringToClipboard, isArray, isString} from "@utils/app";
import {instanceOf} from "prop-types";

export const TAG_VALUE_TYPES = {
    EMPTY: 'EMPTY',
    TEXT: 'TEXT',
    ITEM: 'ITEM',
    CLIPBOARD: 'CLIPBOARD'
};

const TAB_CHAR = '    ';

export default class CTag{
    constructor(name, tags, properties = {}, parent = null) {
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._name = name;
        this._tags = tags;
        this._properties = this.convertProperties(properties);
        this._minimized = false;
        this._valueType = this.getValueType();
        this._parent = parent;
    }

    static createTag(name = '', node = null, parent = null){
        let tags = [];
        let attributes = {};
        let newTag = new CTag(name);
        if(node){
            let nodeValue = null;
            if(node.hasOwnProperty('__oc__value')){
                nodeValue = node.__oc__value;
            } else if(node.hasOwnProperty('_text')){
                nodeValue = node._text;
            }
            if(node.hasOwnProperty('__oc__attributes'))
                attributes = node.__oc__attributes;
            else if(node.hasOwnProperty('_attributes')){
                attributes = node._attributes;
            }
            if(nodeValue !== null){
                tags = nodeValue;
            } else {
                for (let subNode in node) {
                    if (subNode !== '__oc__attributes' && subNode !== '_attributes' && subNode !== '__oc__value' && subNode !== '_text') {
                        if(isArray(node[subNode])){
                            for(let i = 0; i < node[subNode].length; i++){
                                tags.push(CTag.createTag(subNode, node[subNode][i], newTag));
                            }
                        } else {
                            tags.push(CTag.createTag(subNode, node[subNode], newTag));
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
        return newTag;
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
            const newTag = new CTag(nameOrTag, tags, {}, this);
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

    get parent(){
        return this._parent;
    }

    set parent(parent){
        this._parent = parent;
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
}