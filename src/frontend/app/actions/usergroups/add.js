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

import { UserGroupsAction } from '@utils/actions';


/**
 * add user group
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const addUserGroup = (usergroup) => {
    return {
        type: UserGroupsAction.ADD_USERGROUP,
        payload: usergroup,
    };
};

/**
 * add user group fulfilled
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const addUserGroupFulfilled = (usergroup) => {
    return {
        type: UserGroupsAction.ADD_USERGROUP_FULFILLED,
        payload: usergroup,
    };
};

/**
 * add user group rejected
 * @param error
 * @returns {promise}
 */
const addUserGroupRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.ADD_USERGROUP_REJECTED,
        payload: error
    });
};

/**
 * add icon into user group
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const addGroupIcon = (usergroup) => {
    return {
        type: UserGroupsAction.ADD_GROUPICON,
        payload: usergroup,
    };
};

/**
 * add icon into user group fulfilled
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const addGroupIconFulfilled = (usergroup) => {
    return {
        type: UserGroupsAction.ADD_GROUPICON_FULFILLED,
        payload: usergroup,
    };
};

/**
 * add icon into user group rejected
 * @param error
 * @returns {promise}
 */
const addGroupIconRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.ADD_GROUPICON_REJECTED,
        payload: error
    });
};

export{
    addUserGroup,
    addUserGroupFulfilled,
    addUserGroupRejected,
    addGroupIcon,
    addGroupIconFulfilled,
    addGroupIconRejected,
};