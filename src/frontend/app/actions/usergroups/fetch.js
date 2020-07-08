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

import {UserGroupsAction} from '@utils/actions';


/**
 * check uniqueness of the name
 * @param userGroup
 * @returns {{type: string, payload: {}}}
 */
const checkUserGroupName = (userGroup) => {
    return {
        type: UserGroupsAction.CHECK_USERGROUPNAME,
        payload: userGroup,
    };
};

/**
 * check uniqueness of the name fulfilled
 * @param userGroup
 * @returns {{type: string, payload: {}}}
 */
const checkUserGroupNameFulfilled = (userGroup) => {
    return {
        type: UserGroupsAction.CHECK_USERGROUPNAME_FULFILLED,
        payload: userGroup,
    };
};

/**
 * check uniqueness of the name rejected
 * @param error
 * @returns {promise}
 */
const checkUserGroupNameRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.CHECK_USERGROUPNAME_REJECTED,
        payload: error
    });
};

/**
 * fetch user group
 * @param userGroup
 * @returns {{type: string, payload: {}}}
 */
const fetchUserGroup = (userGroup) => {
    return {
        type: UserGroupsAction.FETCH_USERGROUP,
        payload: userGroup,
    };
};

/**
 * fetch user group fulfilled
 * @param userGroup
 * @returns {{type: string, payload: {}}}
 */
const fetchUserGroupFulfilled = (userGroup) => {
    return {
        type: UserGroupsAction.FETCH_USERGROUP_FULFILLED,
        payload: userGroup,
    };
};

/**
 * fetch user group rejected
 * @param error
 * @returns {promise}
 */
const fetchUserGroupRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.FETCH_USERGROUP_REJECTED,
        payload: error
    });
};

/**
 * fetch user group canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchUserGroupCanceled = (message) => {
    return {
        type: UserGroupsAction.FETCH_USERGROUP_CANCELED,
        payload: message
    };
};

/**
 * fetch user groups
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, settings: {}}}
 */
const fetchUserGroups = (settings = {}) => {
    return {
        type: UserGroupsAction.FETCH_USERGROUPS,
        settings,
    };
};

/**
 * fetch user groups fulfilled
 * @param usergroups
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: [], settings: {}}}
 */
const fetchUserGroupsFulfilled = (usergroups, settings = {}) => {
    return{
        type: UserGroupsAction.FETCH_USERGROUPS_FULFILLED,
        payload: usergroups,
        settings,
    };
};

/**
 * fetch user groups rejected
 * @param error
 * @returns {promise}
 */
const fetchUserGroupsRejected = (error) => {
    return Rx.Observable.of({
        type: UserGroupsAction.FETCH_USERGROUPS_REJECTED,
        payload: error
    });
};

/**
 * fetch user groups canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchUserGroupsCanceled = (message) => {
    return {
        type: UserGroupsAction.FETCH_USERGROUPS_CANCELED,
        payload: message
    };
};

export {
    checkUserGroupName,
    checkUserGroupNameFulfilled,
    checkUserGroupNameRejected,
    fetchUserGroups,
    fetchUserGroupsFulfilled,
    fetchUserGroupsCanceled,
    fetchUserGroupsRejected,
    fetchUserGroup,
    fetchUserGroupFulfilled,
    fetchUserGroupRejected,
    fetchUserGroupCanceled,
};