


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

import CXmlSuccess from "./CXmlSuccess";
import CXmlFail from "./CXmlFail";
import {Response} from "../../invoker/Response";


/**
 * XmlResponse class
 */
export default class CXmlResponse{

    constructor(response = Response.createResponse()){
        this._success = response && response.success ? CXmlSuccess.createSuccess(response.success) : null;
        this._fail = response && response.fail ? CXmlFail.createFail(response.fail) : null;
    }

    static createResponse(response){
        return new CXmlResponse(response);
    }

    getObject(){
        if(this._success === null && this._fail === null){
            return null;
        }
        let obj = {
            success: this._success.getObject(),
            fail: this._fail.getObject(),
        };
        return obj;
    }
}