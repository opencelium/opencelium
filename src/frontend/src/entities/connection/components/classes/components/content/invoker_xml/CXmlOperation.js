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

import CXmlRequest from "./request/CXmlRequest";
import CXmlResponse from "./response/CXmlResponse";
import COperation from "../invoker/COperation";


/**
 * XmlOperation Class
 */
export default class CXmlOperation{

    constructor(operation = COperation.createOperation()){
        this._attributes = {name: operation.name, type: operation.type};
        this._request = this.convertRequest(operation.request);
        this._response = this.convertResponse(operation.response);
    }

    static createOperation(operation){
        return new CXmlOperation(operation);
    }

    convertRequest(request){
        if(!(request instanceof CXmlRequest)) {
            return CXmlRequest.createRequest(request);
        }
        return request;
    }

    convertResponse(response){
        if(!(response instanceof CXmlResponse)) {
            return CXmlResponse.createResponse(response);
        }
        return response;
    }

    getObject(){
        let obj = {
            _attributes: this._attributes,
            request: this._request.getObject(),
            response: this._response.getObject(),
        };
        return obj;
    }
}