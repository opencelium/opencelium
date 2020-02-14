/*
 * Copyright (C) <2019>  <becon GmbH>
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


import {isString, isArray} from "../../../../../utils/app";
import {FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT, FIELD_TYPE_STRING} from "../../connection/method/CMethodItem";
import CSuccess from "../../invoker/response/CSuccess";
import CXmlReParent from "../CXmlReParent";

/**
 * (not used)
 */
export default class CXmlSuccess extends CXmlReParent{

    constructor(success = CSuccess.createSuccess()){
        super(success);
        this._attributes = {status: success.status === '' ? '200' : success.status};
    }

    static createSuccess(success){
        return new CXmlSuccess(success);
    }

    getObject(){
        let obj = {
            _attributes: this._attributes,
            body: this._body,
        };
        if(this._header !== null){
            obj.header = this._header;
        }
        return obj;
    }
}