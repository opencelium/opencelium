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

import {ComponentsAction} from '@utils/actions';
import {
    fetchComponentsFulfilled,fetchComponentsRejected,
} from '@actions/components/fetch';

import {doRequest} from "@utils/auth";


/**
 * main url for components
 */
const urlPrefix = 'component';

/**
 * fetch all components
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchComponentsEpic = (action$, store) => {
    return action$.ofType(ComponentsAction.FETCH_COMPONENTS)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: fetchComponentsFulfilled,
                reject: fetchComponentsRejected,
            });
        });
};


export {
    fetchComponentsEpic,
};