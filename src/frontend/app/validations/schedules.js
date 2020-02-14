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

import moment from 'moment';


/**
 * validation of the adding schedule
 */
export function validateAddSchedule(schedule){
    let result = {success: true, message: ''};
    if(schedule.title === ''){
        result.success = false;
        result.message = 'TITLE_EMPTY';
        result.id = 'add_title';
        return result;
    }
    if(schedule.connectionId === null){
        result.success = false;
        result.message = 'CONNECTION_NULL';
        result.id = 'add_connection';
        return result;
    }
    if(schedule.cronExp === ''){
        result.success = false;
        result.message = 'CRON_EXP_NOT_VALID';
        result.id = 'add_cron';
    }
    return result;
}