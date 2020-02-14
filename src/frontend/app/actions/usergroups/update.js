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

import { UserGroupsAction } from '../../utils/actions';


/**
 * update user group
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const updateUserGroup = (usergroup) => {
    return {
        type: UserGroupsAction.UPDATE_USERGROUP,
        payload: usergroup,
    };
};

/**
 * update user group fulfilled
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const updateUserGroupFulfilled = (usergroup) => {
    return {
        type: UserGroupsAction.UPDATE_USERGROUP_FULFILLED,
        payload: usergroup,
    };
};

/**
 * update user group rejected
 * @param error
 * @returns {promise}
 */
const updateUserGroupRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.UPDATE_USERGROUP_REJECTED,
        payload: error
    });
};


/**
 * update icon of the user group
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const updateGroupIcon = (usergroup) => {
    return {
        type: UserGroupsAction.UPDATE_GROUPICON,
        payload: usergroup,
    };
};

/**
 * update icon of the user group fulfilled
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const updateGroupIconFulfilled = (usergroup) => {
    return {
        type: UserGroupsAction.UPDATE_GROUPICON_FULFILLED,
        payload: usergroup,
    };
};

/**
 * update icon of the user group rejected
 * @param error
 * @returns {promise}
 */
const updateGroupIconRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.UPDATE_GROUPICON_REJECTED,
        payload: error
    });
};


export{
    updateUserGroup,
    updateUserGroupFulfilled,
    updateUserGroupRejected,
    updateGroupIcon,
    updateGroupIconFulfilled,
    updateGroupIconRejected,
};