/*
 * Copyright (C) <2021>  <becon GmbH>
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


import CSuccess from "./CSuccess";
import CFail from "./CFail";

export const RESPONSE_SUCCESS = 'success';
export const RESPONSE_FAIL = 'fail';

/**
 * Response Class
 */
export default class CResponse{

    constructor(success = null, fail = null){
        this._success = CSuccess.createSuccess(success);
        this._fail = CFail.createFail(fail);
    }

    static createResponse(response){
        let success = response && response.hasOwnProperty('success') ? response.success : null;
        let fail = response && response.hasOwnProperty('fail') ? response.fail : null;
        return new CResponse(success, fail);
    }

    get success(){
        return this._success;
    }

    set success(success){
        this._success = success;
    }

    get fail(){
        return this._fail;
    }

    set fail(fail){
        this._fail = fail;
    }

    getObject(){
        let obj = {
            success: this._success.getObject(),
            fail: this._fail.getObject(),
        };
        return obj;
    }
}