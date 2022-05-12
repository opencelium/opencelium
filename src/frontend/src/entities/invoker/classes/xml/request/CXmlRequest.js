/*
 * Copyright (C) <2022>  <becon GmbH>
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

import {Request} from "../../Request";
import CXmlReParent from "../CXmlReParent";

/**
 * XmlRequest class
 */
export default class CXmlRequest extends  CXmlReParent{

    constructor(request = Request.createRequest()){
        super(request);
        this._method = request.method;
        this._endpoint = request.endpoint;
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