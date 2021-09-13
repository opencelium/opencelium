
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

/**
 * @param webhook - webhook
 * to validate before add webhook
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
 * NOT_USED to validate before update webhook
 * @param webhook - webhook
 * to validate before update webhook
 */
export function validateUpdateWebHook(webhook){
    return {success: true, message: ''};
}

/**
 * @param webhook - webhook
 * to validate before delete webhook
 */
export function validateDeleteWebHook(webhook){
    let result = {success: true, message: ''};
    if(!webhook.hasOwnProperty('id') && !webhook.hasOwnProperty('schedulerId')){
        result.success = false;
        result.message = 'NOT_ENOUGH_DATA';
    }
    return result;
}