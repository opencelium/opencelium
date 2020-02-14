
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

/**
 * validation of the adding webhook
 */
export function validateAddWebHook(webhook){
    let result = {success: true, message: ''};
    if(!webhook.hasOwnProperty('userId') || !webhook.hasOwnProperty('schedule')){
        result.success = false;
        result.message = 'NOT_ENOUGH_DATA';
    }
    return result;
}

/**
 * (not used) validation of the updating webhook
 */
export function validateUpdateWebHook(webhook){
    return {success: true, message: ''};
}

/**
 * validation of the deletion webhook
 */
export function validateDeleteWebHook(webhook){
    let result = {success: true, message: ''};
    if(!webhook.hasOwnProperty('id') || !webhook.hasOwnProperty('schedulerId')){
        result.success = false;
        result.message = 'NOT_ENOUGH_DATA';
    }
    return result;
}