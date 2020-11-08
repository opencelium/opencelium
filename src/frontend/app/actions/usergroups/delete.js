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
 * delete user group
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const deleteUserGroup = (usergroup) => {
    return {
        type: UserGroupsAction.DELETE_USERGROUP,
        payload: usergroup,
    };
};

/**
 * delete user group fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteUserGroupFulfilled = (status) => {
    return {
        type: UserGroupsAction.DELETE_USERGROUP_FULFILLED,
        payload: status,
    };
};

/**
 * delete user group rejected
 * @param error
 * @returns {promise}
 */
const deleteUserGroupRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.DELETE_USERGROUP_REJECTED,
        payload: error
    });
};

/**
 * delete user group icon
 * @param usergroup
 * @returns {{type: string, payload: {}}}
 */
const deleteUserGroupIcon = (usergroup) => {
    return {
        type: UserGroupsAction.DELETE_USERGROUPICON,
        payload: usergroup,
    };
};

/**
 * delete user group icon fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteUserGroupIconFulfilled = (status) => {
    return {
        type: UserGroupsAction.DELETE_USERGROUPICON_FULFILLED,
        payload: status,
    };
};

/**
 * delete user group icon rejected
 * @param error
 * @returns {promise}
 */
const deleteUserGroupIconRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.DELETE_USERGROUPICON_REJECTED,
        payload: error
    });
};


export{
    deleteUserGroup,
    deleteUserGroupFulfilled,
    deleteUserGroupRejected,
    deleteUserGroupIcon,
    deleteUserGroupIconFulfilled,
    deleteUserGroupIconRejected
};