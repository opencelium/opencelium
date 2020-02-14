/*
 * Copyright (C) <2020>  <becon GmbH>
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

import CRequest from "../../invoker/request/CRequest";
import CXmlReParent from "../CXmlReParent";

/**
 * (not used)
 */
export default class CXmlRequest extends  CXmlReParent{

    constructor(request = CRequest.createRequest()){
        super(request);
        this._method = request.method;
        this._endpoint = request.query;
    }

    static createRequest(request){
        return new CXmlRequest(request);
    }

    getObject(){
        if(this._endpoint === '' && this._method === ''){
            return null;
        }
        let obj = {
            method: this._method,
            endpoint: this._endpoint,
            body: this._body,
        };
        if(this._header !== null){
            obj.header = this._header;
        }
        return obj;
    }
}