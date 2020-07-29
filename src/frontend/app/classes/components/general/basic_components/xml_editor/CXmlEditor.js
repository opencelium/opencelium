import {isArray, isString} from "@utils/app";
import {xml2js} from 'xml-js';
import CTag from "@classes/components/general/basic_components/xml_editor/CTag";

export default class CXmlEditor{
    constructor(xml) {
        this._xml = xml2js(xml, {compact: true});
        this._declaration = null;
        this._tag = null;
        this.convertFromXml();
    }

    static getPlaceholder(){
        return '<?xml ... ?>';
    }

    static getClassName(){
        return 'method_body_xml';
    }

    static hasImport(){
        return false;
    }

    static createXmlEditor(xml){
        if(isString(xml)) {
            return new CXmlEditor(xml);
        }
        return null;
    }

    static isAbsolute(){
        return false;
    }

    convertFromXml(){
        if(this._xml.hasOwnProperty('_declaration')){
            this._declaration = CTag.createTag('xml', this._xml._declaration);
        }
        for(let node in this._xml){
            if(node !== '_declaration'){
                this._tag = CTag.createTag(node, this._xml[node]);
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
        this._declaration = new CTag('xml', null);
    }

    get tag(){
        return this._tag;
    }

    addTag(name, tags){
        this._tag = new CTag(name, tags);
    }

    convertDeclaration(){
        if(this._declaration) {
            return `<?xml ${this._declaration.properties.map(property => property.convertToXml()).join(' ')} ?>`;
        }
        return '';
    }

    convertToXml(settings = {}){
        const {hasFormat} = settings;
        const declaration = this.convertDeclaration();
        if(hasFormat || typeof hasFormat === 'undefined'){
            const coreTag = this._tag.convertToXml(settings);
            return `${declaration}\n${coreTag}`;
        } else{
            const coreTag = this._tag.convertToXml(settings);
            return `${declaration}${coreTag}`;
        }
    }
}