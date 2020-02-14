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

import {consoleLog, isId, isNumber, isString} from "../../../../utils/app";
import {NO_DATA} from "../../../../utils/constants/app";

const TAID_SEPARATOR = '-';

/**
 * LastExecution class for LastExecution in Schedule module
 */
export default class CLastExecution{
    constructor(id = 0, success = NO_DATA, fail = NO_DATA){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._success = success;
        this._fail = fail;
    }

    static createLastExecution(lastExecution){
        let id = lastExecution && lastExecution.hasOwnProperty('lastExecutionId') ? lastExecution.lastExecutionId : 0;
        let success = lastExecution && lastExecution.hasOwnProperty('success') ? lastExecution.success : NO_DATA;
        let fail = lastExecution && lastExecution.hasOwnProperty('fail') ? lastExecution.fail : NO_DATA;
        return new CLastExecution(id, success, fail);
    }

    checkLastExecutionResult(data){
        let result = data && data.hasOwnProperty('startTime') && data.hasOwnProperty('endTime')
            && data.hasOwnProperty('duration') && isNumber(data.duration) && data.hasOwnProperty('taId')
            && this.checkTaId(data.taId);
        if(result){
            return true;
        }
    }

    checkTaId(taId){
        let ids = isString(taId) ? taId.split(TAID_SEPARATOR) : [];
        return ids && ids.length === 2 && isId(ids[0]) && isId(ids[1]);
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`LastExecution has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get success(){
        return this._success;
    }

    get successStartTime(){
        return this.checkLastExecutionResult(this._success) ? this._success.startTime : NO_DATA;
    }

    get successEndTime(){
        return this.checkLastExecutionResult(this._success) ? this._success.endTime : NO_DATA;
    }

    get successDuration(){
        return this.checkLastExecutionResult(this._success) ? this._success.duration : 0;
    }

    get successTaId(){
        return this.checkLastExecutionResult(this._success) && this.checkTaId(this._success.taId) ? this._success.taId : '';
    }

    get successExecutionId(){
        return this.checkLastExecutionResult(this._success) && this.checkTaId(this._success.taId) ? this._success.taId.split(TAID_SEPARATOR)[1] : '';
    }

    set success(success){
        if(this.checkLastExecutionResult(success)){
            this._success = success;
        }
    }

    get fail(){
        return this._fail;
    }

    get failStartTime(){
        return this.checkLastExecutionResult(this._fail) ? this._fail.startTime : NO_DATA;
    }

    get failEndTime(){
        return this.checkLastExecutionResult(this._fail) ? this._fail.endTime : NO_DATA;
    }

    get failDuration(){
        return this.checkLastExecutionResult(this._fail) ? this._fail.duration : 0;
    }

    get failTaId(){
        return this.checkLastExecutionResult(this._fail) && this.checkTaId(this._fail.taId) ? this._fail.taId : '';
    }

    get failExecutionId(){
        return this.checkLastExecutionResult(this._fail) && this.checkTaId(this._fail.taId) ? this._fail.taId.split(TAID_SEPARATOR)[1] : '';
    }

    set fail(fail){
        if(this.checkLastExecutionResult(fail)) {
            this._fail = fail;
        }
    }

    getObject(){
        let obj = {
            success: this._success,
            fail: this._fail,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}