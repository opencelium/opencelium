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

import {SchedulesAction} from '../utils/actions';
import {
    fetchScheduleFulfilled, fetchScheduleRejected,
    fetchSchedulesFulfilled, fetchSchedulesRejected,
    triggerScheduleFulfilled, triggerScheduleRejected,
    triggerScheduleSuccessfullyFulfilled, fetchCurrentSchedules,
    fetchCurrentSchedulesFulfilled, fetchCurrentSchedulesRejected,
    fetchSchedulesByIdsFulfilled, fetchSchedulesByIdsRejected,
} from '../actions/schedules/fetch';
import {
    addScheduleFulfilled ,addScheduleRejected,
    addWebHookFulfilled, addWebHookRejected,
} from '../actions/schedules/add';
import {
    updateScheduleFulfilled, updateScheduleRejected,
    updateScheduleStatusFulfilled, updateScheduleStatusRejected,
    startSchedulesFulfilled, startSchedulesRejected,
    enableSchedulesFulfilled, enableSchedulesRejected,
    disableSchedulesFulfilled, disableSchedulesRejected,
    updateWebHookFulfilled, updateWebHookRejected, updateSchedule,
} from '../actions/schedules/update';
import {
    deleteScheduleFulfilled, deleteScheduleRejected,
    deleteSchedulesFulfilled,deleteSchedulesRejected,
    deleteWebHookFulfilled, deleteWebHookRejected,
} from '../actions/schedules/delete';
import {doRequest} from "../utils/auth";

import {validateAddSchedule, validateWebHook} from "../validations/schedules";
import {periodic, fromPromise} from 'most';

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
                     setTimeout(() => {
                         if(!isCanceledCurrentSchedules) {
                             store.dispatch(fetchCurrentSchedules());
                         } else{
                             isCanceledCurrentSchedules = false;
                         }
                     }, INTERVAL_OF_GETTING_CURRENT_SCHEDULES);
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
    fetchSchedulesEpic,
    fetchCurrentSchedulesEpic,
    fetchSchedulesByIdsEpic,
    addScheduleEpic,
    updateScheduleEpic,
    deleteScheduleEpic,
    startSchedulesEpic,
    enableSchedulesEpic,
    disableSchedulesEpic,
    deleteSchedulesEpic,
    updateScheduleStatusEpic,
    triggerScheduleEpic,
    triggerScheduleSuccessEpic,
};