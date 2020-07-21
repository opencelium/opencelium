export default class CProperty{
    constructor(name = '', value = '') {
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._name = name;
        this._value = value;
    }

    static createProperty(name, value){
        return new CProperty(name, value);
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
    }

    get uniqueIndex(){
        return this._uniqueIndex;
    }
}