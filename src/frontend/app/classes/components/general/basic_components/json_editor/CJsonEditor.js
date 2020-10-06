
import {CBodyEditor} from "@classes/components/general/basic_components/CBodyEditor";

export class CJsonEditor extends CBodyEditor{
    static getPlaceholder(){
        return '{ ... }';
    }

    static getClassName(params = {isDraft: false}){
        return params.isDraft ? 'method_body_draft' : 'method_body';
    }

    static hasImport(){
        return true;
    }

    static isAbsolute(){
        return true;
    }

    static getParent(textarea = null){
        return textarea && textarea.id ? document.getElementById(textarea.id) : document.activeElement;
    }

    static convertToBodyFormat(bodyData){
        return bodyData.updated_src;
    }

    static convertForFieldBinding(reactJson){
        if(reactJson) {
            return {
                namespaces: reactJson.namespace,
                newValue: reactJson.new_value,
                name: reactJson.name,
                existingValue: reactJson.existing_value,
            };
        }
        return null;
    }
}