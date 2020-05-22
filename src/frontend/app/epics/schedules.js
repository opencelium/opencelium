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
import Rx from 'rxjs/Rx';
import {SchedulesAction} from '../utils/actions';
import {
    fetchScheduleFulfilled,
    fetchScheduleRejected,
    fetchSchedulesFulfilled,
    fetchSchedulesRejected,
    triggerScheduleFulfilled,
    triggerScheduleRejected,
    triggerScheduleSuccessfullyFulfilled,
    fetchCurrentSchedules,
    fetchCurrentSchedulesFulfilled,
    fetchCurrentSchedulesRejected,
    fetchSchedulesByIdsFulfilled,
    fetchSchedulesByIdsRejected,
    fetchScheduleNotificationsFulfilled,
    fetchScheduleNotificationRejected,
    fetchScheduleNotificationFulfilled,
    fetchScheduleNotificationTemplatesFulfilled,
    fetchNotificationRecipientsFulfilled,
    fetchNotificationRecipientsRejected,
    fetchSlackChannelsFulfilled,
    fetchSlackChannelsRejected,
} from '../actions/schedules/fetch';
import {
    addScheduleFulfilled, addScheduleNotificationFulfilled, addScheduleNotificationRejected, addScheduleRejected,
    addWebHookFulfilled, addWebHookRejected,
} from '../actions/schedules/add';
import {
    updateScheduleFulfilled,
    updateScheduleRejected,
    updateScheduleStatusFulfilled,
    updateScheduleStatusRejected,
    startSchedulesFulfilled,
    startSchedulesRejected,
    enableSchedulesFulfilled,
    enableSchedulesRejected,
    disableSchedulesFulfilled,
    disableSchedulesRejected,
    updateWebHookFulfilled,
    updateWebHookRejected,
    updateSchedule,
    updateScheduleNotificationFulfilled,
    updateScheduleNotificationRejected,
} from '../actions/schedules/update';
import {
    deleteScheduleFulfilled,
    deleteScheduleNotificationFulfilled,
    deleteScheduleNotificationRejected,
    deleteScheduleRejected,
    deleteSchedulesFulfilled,
    deleteSchedulesRejected,
    deleteWebHookFulfilled,
    deleteWebHookRejected,
} from '../actions/schedules/delete';
import {doRequest} from "../utils/auth";

import {validateAddSchedule, validateAddScheduleNotification, validateWebHook} from "../validations/schedules";
import {sleepApp} from "../utils/app";

/**
 * main url for schedulers
 */
const urlPrefix = 'scheduler';
const INTERVAL_OF_GETTING_CURRENT_SCHEDULES = 2000;


/**
 * trigger one schedule
 */
const triggerScheduleEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.TRIGGER_SCHEDULE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/execute/${action.payload.id}`;
            return doRequest({url},{
                success: triggerScheduleFulfilled,
                reject: triggerScheduleRejected,
            });
        });
};

/**
 * (only for testing) trigger one schedule with successful result
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const triggerScheduleSuccessEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.TRIGGER_SCHEDULESUCCESS)
        .debounceTime(500)
        .mergeMap((action) => {
            return triggerScheduleSuccessfullyFulfilled();
        });
};

/**
 * fetch current schedules
 */
let isCanceledCurrentSchedules = false;
export function cancelCurrentSchedule(){
    isCanceledCurrentSchedules = true;
}
const fetchCurrentSchedulesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_CURRENTSCHEDULES)
        .debounceTime(500)
        .mergeMap((action) => {
             let url = `${urlPrefix}/running/all`;
             return doRequest({url},{
                 success: (data) => {
                     /*setTimeout(() => {
                         if(!isCanceledCurrentSchedules) {
                             store.dispatch(fetchCurrentSchedules());
                         } else{
                             isCanceledCurrentSchedules = false;
                         }
                     }, INTERVAL_OF_GETTING_CURRENT_SCHEDULES);*/
                     return fetchCurrentSchedulesFulfilled(data);
                 },
                 reject: (data) => {
                     setTimeout(() => {
                         if(!isCanceledCurrentSchedules) {
                             store.dispatch(fetchCurrentSchedules());
                         } else{
                             isCanceledCurrentSchedules = false;
                         }
                     }, INTERVAL_OF_GETTING_CURRENT_SCHEDULES);
                     return fetchCurrentSchedulesRejected(data);
                 },
                 cancel: () => {
                     return action$.ofType(SchedulesAction.FETCH_CURRENTSCHEDULES_CANCELED);
                 },

             });
        });
};

/**
 * fetch one schedule by id
 */
const fetchScheduleEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SCHEDULE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url},{
                success: fetchScheduleFulfilled,
                reject: fetchScheduleRejected,
            });
        });
};
/**
 * fetch schedule notification by schedule id
 */
const fetchScheduleNotificationEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SCHEDULENOTIFICATION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/notificaiton/${action.payload.notificationId}`;
            return doRequest({url},{
                success: fetchScheduleNotificationFulfilled,
                reject: fetchScheduleNotificationRejected,
            });
        });
};

/**
 * fetch all schedules
 */
const fetchSchedulesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SCHEDULES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: fetchSchedulesFulfilled,
                reject: fetchSchedulesRejected,
                cancel: action$.ofType(SchedulesAction.FETCH_SCHEDULES_CANCELED)
            });
        });
};

/**
 * fetch all schedule notification
 */
const fetchScheduleNotificationsEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SCHEDULENOTIFICATIONS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/notifications/all`;
            return doRequest({url},{
                success: fetchScheduleNotificationsFulfilled,
                reject: fetchScheduleNotificationRejected,
                cancel: action$.ofType(SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_CANCELED)
            });
        });
};

/**
 * fetch templates of notification in schedule by notification type
 */
const fetchScheduleNotificationTemplatesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/notificaiton/`;
            return doRequest({url},{
                success: fetchScheduleNotificationTemplatesFulfilled,
                reject: fetchScheduleNotificationTemplatesRejected,
            });
        });
};

/**
 * fetch recipients for email notification
 */
const fetchNotificationRecipientsEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `user/all`;
            return doRequest({url},{
                success: fetchNotificationRecipientsFulfilled,
                reject: fetchNotificationRecipientsRejected,
            });
        });
};
/**
 * fetch channels for slack notification
 */
const fetchSlackChannelsEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SLACKCHANNELS)
        .debounceTime(500)
        .mergeMap((action) => {
            const testData = [{value: 1, label: 'Channel 1'}, {value: 2, label: 'Channel 2'}];
            return Rx.Observable.of(fetchSlackChannelsFulfilled(testData));
            //let url = `user/all`;
            /*return doRequest({url},{
                success: fetchSlackChannelsFulfilled,
                reject: fetchSlackChannelsRejected,
            });*/
        });
};

/**
 * fetch schedules by ids
 */
const fetchSchedulesByIdsEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.FETCH_SCHEDULESBYIDS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/ids`;
            return doRequest({url, method: 'post', data: {schedulerIds: action.payload}},{
                success: fetchSchedulesByIdsFulfilled,
                reject: fetchSchedulesByIdsRejected,
            });
        });
};

/**
 * add one schedule
 */
const addScheduleEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.ADD_SCHEDULE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            let validation = validateAddSchedule(action.payload);
            if(validation.success) {
                return doRequest({url, method: 'post', data}, {
                        success: addScheduleFulfilled,
                        reject: addScheduleRejected,
                    },
                );
            } else{
                return addScheduleRejected({'message': validation.message, id: validation.id});
            }
        });
};

/**
 * add schedule notification
 */
const addScheduleNotificationEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.ADD_SCHEDULENOTIFICATION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            return doRequest({url, method: 'post', data}, {
                    success: addScheduleNotificationFulfilled,
                    reject: addScheduleNotificationRejected,
                },
            );
        });
};

/**
 * update one schedule
 */
const updateScheduleEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.UPDATE_SCHEDULE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}/title`;
            let {connection, ...data} = action.payload;
            data.connectionId = connection.id;
            return doRequest({url, method: 'put', data},{
                success: updateScheduleFulfilled,
                reject: updateScheduleRejected,},
            );
        });
};

/**
 * update schedule notification
 */
const updateScheduleNotificationEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.UPDATE_SCHEDULENOTIFICATION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/notification/${action.payload.id}`;
            let {connection, ...data} = action.payload;
            data.connectionId = connection.id;
            return doRequest({url, method: 'put', data},{
                success: updateScheduleNotificationFulfilled,
                reject: updateScheduleNotificationRejected,},
            );
        });
};

/**
 * update status of the schedule
 */
const updateScheduleStatusEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.UPDATE_SCHEDULESTATUS)
        .debounceTime(500)
        .mergeMap((action) => {
            let {id, status} = action.payload;
            let url = `${urlPrefix}/${id}/status`;
            return doRequest({url, method: 'put', data: {status}},{
                success: updateScheduleStatusFulfilled,
                reject: updateScheduleStatusRejected,},
                res => {return {id, status};},
            );
        });
};

/**
 * delete one schedule by id
 */
const deleteScheduleEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.DELETE_SCHEDULE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: 'delete'},{
                    success: deleteScheduleFulfilled,
                    reject: deleteScheduleRejected,},
                res => {return {...res.response, id: action.payload.id};}
            );
        });
};

/**
 * delete schedule notification by schedule id
 */
const deleteScheduleNotificationEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.DELETE_SCHEDULENOTIFICATION)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            let data = action.payload;
            return doRequest({url, method: 'delete', data},{
                    success: deleteScheduleNotificationFulfilled,
                    reject: deleteScheduleNotificationRejected,},
                res => {return {schedulerIds: data.schedulerIds};}
            );
        });
};

/**
 * start all selected schedules by id
 */
const startSchedulesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.START_SCHEDULES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/startAll`;
            let data = action.payload;
            return doRequest({url, method: 'put', data},{
                success: startSchedulesFulfilled,
                reject: startSchedulesRejected,},
                res => {return {schedulerIds: data.schedulerIds};}
            );
        });
};

/**
 * enable all selected schedules by id
 */
const enableSchedulesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.ENABLE_SCHEDULES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/enableAll`;
            let data = action.payload;
            return doRequest({url, method: 'put', data},{
                success: enableSchedulesFulfilled,
                reject: enableSchedulesRejected,},
                res => {return {schedulerIds: data.schedulerIds};}
            );
        });
};

/**
 * disable all selected schedules by id
 */
const disableSchedulesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.DISABLE_SCHEDULES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/disableAll`;
            let data = action.payload;
            return doRequest({url, method: 'put', data},{
                success: disableSchedulesFulfilled,
                reject: disableSchedulesRejected,},
                res => {return {schedulerIds: data.schedulerIds};}
            );
        });
};

/**
 * delete all selected schedules by id
 */
const deleteSchedulesEpic = (action$, store) => {
    return action$.ofType(SchedulesAction.DELETE_SCHEDULES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            let data = action.payload;
            return doRequest({url, method: 'delete', data},{
                success: deleteSchedulesFulfilled,
                reject: deleteSchedulesRejected,},
                res => {return {schedulerIds: data.schedulerIds};}
            );
        });
};


export {
    fetchScheduleEpic,
    fetchScheduleNotificationEpic,
    fetchSchedulesEpic,
    fetchScheduleNotificationsEpic,
    fetchCurrentSchedulesEpic,
    fetchScheduleNotificationTemplatesEpic,
    fetchNotificationRecipientsEpic,
    fetchSlackChannelsEpic,
    fetchSchedulesByIdsEpic,
    addScheduleEpic,
    addScheduleNotificationEpic,
    updateScheduleEpic,
    updateScheduleNotificationEpic,
    deleteScheduleEpic,
    deleteScheduleNotificationEpic,
    startSchedulesEpic,
    enableSchedulesEpic,
    disableSchedulesEpic,
    deleteSchedulesEpic,
    updateScheduleStatusEpic,
    triggerScheduleEpic,
    triggerScheduleSuccessEpic,
};