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

import Rx from 'rxjs/Rx';

import { UpdateAssistantAction } from '@utils/actions';


/**
 * delete version
 * @param version
 * @returns {{type: string, payload: {}}}
 */
const deleteVersion = (version) => {
    return {
        type: UpdateAssistantAction.DELETE_VERSION,
        payload: version,
    };
};

/**
 * delete version fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteVersionFulfilled = (status) => {
    return {
        type: UpdateAssistantAction.DELETE_VERSION_FULFILLED,
        payload: status,
    };
};

/**
 * delete version rejected
 * @param error
 * @returns {*}
 */
const deleteVersionRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.DELETE_VERSION_REJECTED,
        payload: error
    });
};


export{
    deleteVersion,
    deleteVersionFulfilled,
    deleteVersionRejected,
};