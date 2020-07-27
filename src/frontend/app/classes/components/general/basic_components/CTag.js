import CProperty from "@classes/components/general/basic_components/CProperty";
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
    constructor(name, tags, properties = {}) {
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._name = name;
        this._tags = tags;
        this._properties = this.convertProperties(properties);
        this._minimized = false;
        this._valueType = this.getValueType();
    }

    static createTag(name, node = null){
        let tags = [];
        let properties = node && node.hasOwnProperty('_attributes') ? node._attributes : {};
        if(node && node.hasOwnProperty('_text')){
            tags = node._text;
        } else {
            for (let subNode in node) {
                if (subNode !== '_attributes' && subNode !== '_text') {
                    if(isArray(node[subNode])){
                        for(let i = 0; i < node[subNode].length; i++){
                            tags.push(CTag.createTag(subNode, node[subNode][i]));
                        }
                    } else {
                        tags.push(CTag.createTag(subNode, node[subNode]));
                    }
                }
            }
        }
        if(tags.length === 0){
            tags = null;
        }
        return new CTag(name, tags, properties);
    }

    convertProperties(properties){
        let convertedProperties = [];
        for(let property in properties){
            convertedProperties.push(CProperty.createProperty(property, properties[property]));
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

    addTag(nameOrTag, tags){
        if(nameOrTag instanceof CTag){
            this.tags.push(nameOrTag);
        } else {
            const newTag = new CTag(nameOrTag, tags);
            if (isArray(this._tags)) {
                this._tags.push(newTag);
            } else {
                this._tags = [newTag];
            }
        }
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

    addProperty(property){
        let index = this._properties.findIndex(p => p.name === name);
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