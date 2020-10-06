import {checkReferenceFormat} from "@utils/app";

export default class CProperty{
    constructor(name = '', value = '', parent = null) {
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._name = name;
        this._value = value;
        this._parent = parent;
        this._isReference = checkReferenceFormat(value, true);
    }

    static createProperty(name, value, parent){
        return new CProperty(name, value, parent);
    }

    update(name, value){
        this._name = name;
        this._value = value;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get value(){
        return this._value;
    }

    set value(value){
        this._value = value;
        this._isReference = checkReferenceFormat(value, true);
    }

    get uniqueIndex(){
        return this._uniqueIndex;
    }

    get parent(){
        return this._parent;
    }

    get isReference(){
        return this._isReference;
    }

    set isReference(isReference){
        this._isReference = isReference;
    }

    convertToXml(){
        return `${this._name}="${this._value}"`;
    }

    convertToBackendXml(){
        return{
            [this._name]: this._value,
        };
    }
}