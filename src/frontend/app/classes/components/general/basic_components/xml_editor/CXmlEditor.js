import {isArray, isString} from "@utils/app";
import {xml2js} from 'xml-js';
import CTag from "@classes/components/general/basic_components/xml_editor/CTag";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import {CBodyEditor} from "@classes/components/general/basic_components/CBodyEditor";
import CXml from "@classes/components/content/xml/CXml";

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
                        CXmlEditor.updateFieldsBinding(
                            connection,
                            connector,
                            method,
                            {
                                ...xmlData,
                                existingValue: xmlData.existingValue[i].tags,
                                newValue,
                                namespaces: [...xmlData.namespaces, xmlData.name],
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
        if(item instanceof CTag || item instanceof CProperty) {
            name = item instanceof CProperty ? `@${item.name}` : item.name;
            if(item.parent) {
                parent = item.parent;
                while (true) {
                    if(!(parent instanceof CXmlEditor)){
                        namespaces.unshift(parent instanceof CProperty ? `@${parent.name}` : parent.name);
                        if (!parent.parent) {
                            break;
                        } else {
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
            };
        }
    }

    static convertToBodyFormat(bodyData){
        return bodyData.convertToXml();
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
                this._tag = CTag.createTag(node, this._xml[node], this);
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
        this._tag = new CTag(name, tags, {}, this);
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
}