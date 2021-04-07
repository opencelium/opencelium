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
 * @param schedule - schedule
 * to validate before add schedule
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

/**
 * @param notification
 * to validate before add schedule notification
 */
export function validateAddScheduleNotification(notification){
    let result = {success: true, message: ''};
    return result;
}

/**
 * @param notification - notification
 * to validate before add/update schedule
 */
export function validateChangeNotification(notification){
    let result = {success: true, message: ''};
    if(notification.eventType === ''){
        result.success = false;
        result.message = 'EVENT_TYPE_EMPTY';
        result.id = 'input_event_pre';
        return result;
    }
    if(notification.notificationType === ''){
        result.success = false;
        result.message = 'NOTIFICATION_TYPE_EMPTY';
        result.id = 'input_notification_type';
        return result;
    }
    if(notification.template.name === ''){
        result.success = false;
        result.message = 'TEMPLATE_EMPTY';
        result.id = 'input_template_type';
        return result;
    }
    if(notification.recipients.length === 0){
        result.success = false;
        result.message = 'RECIPIENTS_EMPTY';
        result.id = 'input_recipients_rest_search';
    }
    return result;
}