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


import {isArray, isString} from "../../../../../utils/app";
import {FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT, FIELD_TYPE_STRING} from "../../connection/method/CMethodItem";
import CXmlReParent from "../CXmlReParent";
import CFail from "../../invoker/response/CFail";

/**
 * (not used)
 */
export default class CXmlFail extends CXmlReParent{

    constructor(fail = CFail){
        super(fail);
        this._attributes = {status: fail.status === '' ? '404' : fail.status};
    }

    static createFail(fail){
        return new CXmlFail(fail);
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