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

import { UpdateAssistantAction } from '@utils/actions';


/**
 * create a new version
 * @param version
 * @returns {{type: string, payload: {}}}
 */
const uploadVersion = (version) => {
    return {
        type: UpdateAssistantAction.UPLOAD_VERSION,
        payload: version,
    };
};

/**
 * create a new version fulfilled
 * @param version
 * @returns {{type: string, payload: {}}}
 */
const uploadVersionFulfilled = (version) => {
    return {
        type: UpdateAssistantAction.UPLOAD_VERSION_FULFILLED,
        payload: version,
    };
};

/**
 * create a new version rejected
 * @param error
 * @returns {*}
 */
const uploadVersionRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.UPLOAD_VERSION_REJECTED,
        payload: error
    });
};



export{
    uploadVersion,
    uploadVersionFulfilled,
    uploadVersionRejected,
};