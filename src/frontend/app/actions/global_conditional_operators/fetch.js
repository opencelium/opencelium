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

import {GlobalConditionalOperatorAction} from "@utils/actions";
import Rx from "rxjs";

/**
 * fetch conditional operator
 * @returns {{type: string}}
 */
const fetchConditionalOperator = () => {
    return {
        type: GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR
    };
};

/**
 * fetch conditional operator fulfilled
 * @param conditionalOperator
 * @returns {{type: string, payload: {}}}
 */
const fetchConditionalOperatorFulfilled = (conditionalOperator) => {
    return{
        type: GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR_FULFILLED,
        payload: conditionalOperator
    };
};

/**
 * fetch conditional operator rejected
 * @param error
 * @returns {*}
 */
const fetchConditionalOperatorRejected = (error) => {
    return Rx.Observable.of({
        type: GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR_REJECTED,
        payload: error
    });
};

export{
    fetchConditionalOperator,
    fetchConditionalOperatorFulfilled,
    fetchConditionalOperatorRejected,
};