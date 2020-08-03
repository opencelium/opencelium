import {consoleLog, isArray, isEmptyObject, isObject} from "@utils/app";

export const BODY_TYPE = {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
};

export const BODY_FORMAT = {
    JSON: 'json',
    XML: 'xml',
};

export const BODY_DATA = {
    RAW: 'raw',
};

export default class CBody{
    constructor(type = BODY_TYPE.OBJECT, format = BODY_FORMAT.JSON, data = BODY_DATA.RAW, fields) {
        this._type = this.checkType(type) ? type : BODY_TYPE.OBJECT;
        this._format = this.checkFormat(format) ? format : BODY_FORMAT.JSON;
        this._data = this.checkData(data) ? data : BODY_DATA.RAW;
        this._fields = fields === null ? {} : fields;
    }

    static createBody(body){
        const type = body && body.hasOwnProperty('type') ? body.type : BODY_TYPE.OBJECT;
        const format = body && body.hasOwnProperty('format') ? body.format : BODY_FORMAT.JSON;
        const data = body && body.hasOwnProperty('data') ? body.data : BODY_DATA.RAW;
        const fields = body && body.hasOwnProperty('fields') ? body.fields : isObject(body) ? body : {};
        return new CBody(type, format, data, fields);
    }

    checkType(bodyType){
        for(const type in BODY_TYPE) {
            if(bodyType === BODY_TYPE[type]){
                return true;
            }
        }
        consoleLog(`Body has a wrong type: ${bodyType}`);
        return false;
    }

    checkFormat(bodyFormat){
        for(const format in BODY_FORMAT) {
            if(bodyFormat === BODY_FORMAT[format]){
                return true;
            }
        }
        consoleLog(`Body has a wrong format: ${bodyFormat}`);
        return false;
    }

    checkData(bodyData){
        for(const data in BODY_DATA) {
            if(bodyData === BODY_DATA[data]){
                return true;
            }
        }
        consoleLog(`Body has a wrong type: ${bodyData}`);
        return false;
    }

    get type(){
        return this._type;
    }

    set type(type){
        this._type = this.checkType(type) ? type : BODY_TYPE.STRING;
    }

    get format(){
        return this._format;
    }

    set format(format){
        this._format = this.checkFormat(format) ? format : BODY_FORMAT.STRING;
    }

    get data(){
        return this._data;
    }

    set data(data){
        this._data = this.checkData(data) ? data : BODY_DATA.STRING;
    }

    get fields(){
        return this._fields;
    }

    set fields(fields){
        if(fields !== null && !isObject(fields)){
            if(isArray(fields)){
                this._type = BODY_TYPE.ARRAY;
            }
        }
        this._fields = fields === null ? {} : fields;
    }

    getObject(){
        return {
            type: this._type,
            format: this._format,
            data: this._data,
            fields: isEmptyObject(this._fields) ? null : this._fields,
        };
    }
}