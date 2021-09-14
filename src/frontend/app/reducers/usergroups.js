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

import {List, fromJS} from 'immutable';

import {UserGroupsAction} from '@utils/actions';
import { addUserGroupSubscriber, updateUserGroupSubscriber, deleteUserGroupSubscriber } from '@utils/socket/userGroups';

import {updateObj} from '@utils/app';
import {API_REQUEST_STATE} from "@utils/constants/app";


const initialState = fromJS({
    checkingUserGroupName: API_REQUEST_STATE.INITIAL,
    checkNameResult: null,
    fetchingUserGroup: API_REQUEST_STATE.INITIAL,
    addingUserGroup: API_REQUEST_STATE.INITIAL,
    addingGroupIcon: API_REQUEST_STATE.INITIAL,
    updatingUserGroup: API_REQUEST_STATE.INITIAL,
    updatingGroupIcon: API_REQUEST_STATE.INITIAL,
    fetchingUserGroups: API_REQUEST_STATE.INITIAL,
    deletingUserGroup: API_REQUEST_STATE.INITIAL,
    deletingUserGroupIcon: API_REQUEST_STATE.INITIAL,
    deletingUserGroups: API_REQUEST_STATE.INITIAL,
    userGroup: {},
    userGroups: List([]),
    error: null,
    message: {},
    notificationData: {},
});

let userGroup = {};
let userGroups = [];
let index = 0;
let indexes = [];

/**
 * redux reducer for userGroups
 */
const reducer = (state = initialState, action) => {
    userGroups = state.get('userGroups');
    indexes = [];
    switch (action.type) {
        case UserGroupsAction.CHECK_USERGROUPNAME:
            return state.set('checkingUserGroupName', API_REQUEST_STATE.START).set('checkNameResult', null).set('error', null);
        case UserGroupsAction.CHECK_USERGROUPNAME_FULFILLED:
            return state.set('checkingUserGroupName', API_REQUEST_STATE.FINISH).set('checkNameResult', action.payload);
        case UserGroupsAction.CHECK_USERGROUPNAME_REJECTED:
            return state.set('checkingUserGroupName', API_REQUEST_STATE.ERROR).set('error', null).set('checkNameResult', action.payload);
        case UserGroupsAction.FETCH_USERGROUP:
            return state.set('fetchingUserGroup', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.FETCH_USERGROUP_FULFILLED:
            return state.set('fetchingUserGroup', API_REQUEST_STATE.FINISH).set('userGroup', action.payload);
        case UserGroupsAction.FETCH_USERGROUP_REJECTED:
            return state.set('fetchingUserGroup', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.FETCH_USERGROUPS:
            return state.set('fetchingUserGroups', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.FETCH_USERGROUPS_FULFILLED:
            return state.set('fetchingUserGroups', API_REQUEST_STATE.FINISH).set('userGroups', List(action.payload));
        case UserGroupsAction.FETCH_USERGROUPS_REJECTED:
            return state.set('fetchingUserGroups', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.FETCH_USERGROUPS_CANCELED:
            return state.set('fetchingUserGroups', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case UserGroupsAction.ADD_USERGROUP:
            return state.set('addingUserGroup', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.ADD_USERGROUP_FULFILLED:
            addUserGroupSubscriber(action.payload);
            return state.set('addingUserGroup', API_REQUEST_STATE.FINISH).set('userGroups', userGroups.set(userGroups.size, action.payload));
        case UserGroupsAction.ADD_USERGROUP_REJECTED:
            return state.set('addingUserGroup', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.ADD_GROUPICON:
            return state.set('addingGroupIcon', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.ADD_GROUPICON_FULFILLED:
            return state.set('addingGroupIcon', API_REQUEST_STATE.FINISH).set('addingUserGroup', API_REQUEST_STATE.FINISH).set('userGroups', userGroups.set(userGroups.size, action.payload));
        case UserGroupsAction.ADD_GROUPICON_REJECTED:
            return state.set('addingGroupIcon', API_REQUEST_STATE.ERROR).set('addingUserGroup', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.UPDATE_USERGROUP:
            return state.set('updatingUserGroup', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.UPDATE_USERGROUP_FULFILLED:
            updateUserGroupSubscriber(action.payload);
            index = userGroups.findIndex(function (userGroup) {
                return userGroup.id === action.payload.id;
            });
            if (index >= 0) {
                userGroup = action.payload;
                return state.set('updatingUserGroup', API_REQUEST_STATE.FINISH).set('userGroups', userGroups.set(index, updateObj(userGroup, 'userGroup', action.payload)));
            }
            return state.set('updatingUserGroup', API_REQUEST_STATE.FINISH);
        case UserGroupsAction.UPDATE_USERGROUP_REJECTED:
            return state.set('updatingUserGroup', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.UPDATE_GROUPICON:
            return state.set('updatingGroupIcon', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.UPDATE_GROUPICON_FULFILLED:
            updateUserGroupSubscriber(action.payload);
            index = userGroups.findIndex(function (userGroup) {
                return userGroup.id === action.payload.id;
            });
            if (index >= 0) {
                userGroup = action.payload;
                return state.set('updatingUserGroup', API_REQUEST_STATE.FINISH).set('updatingGroupIcon', API_REQUEST_STATE.FINISH).set('userGroups', userGroups.set(index, updateObj(userGroup, 'userGroup', action.payload)));
            }
            return state.set('updatingUserGroup', API_REQUEST_STATE.FINISH).set('updatingGroupIcon', API_REQUEST_STATE.FINISH);
        case UserGroupsAction.UPDATE_GROUPICON_REJECTED:
            return state.set('updatingUserGroup', API_REQUEST_STATE.ERROR).set('updatingGroupIcon', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.DELETE_USERGROUP:
            return state.set('deletingUserGroup', API_REQUEST_STATE.START).set('error', null).set('userGroup', action.payload);
        case UserGroupsAction.DELETE_USERGROUP_FULFILLED:
            deleteUserGroupSubscriber(action.payload);
            index = userGroups.findIndex(function (userGroup) {
                return userGroup.id === action.payload.id;
            });
            if (index >= 0) {
                return state.set('deletingUserGroup', API_REQUEST_STATE.FINISH).set('userGroups', userGroups.delete(index)).set('userGroup', null);
            }
            return state.set('deletingUserGroup', API_REQUEST_STATE.FINISH).set('userGroup', null);
        case UserGroupsAction.DELETE_USERGROUP_REJECTED:
            return state.set('deletingUserGroup', API_REQUEST_STATE.ERROR).set('error', action.payload).set('userGroup', null);
        case UserGroupsAction.DELETE_USERGROUPICON:
            return state.set('deletingUserGroupIcon', API_REQUEST_STATE.START).set('error', null);
        case UserGroupsAction.DELETE_USERGROUPICON_FULFILLED:
            return state.set('updatingUserGroup', API_REQUEST_STATE.FINISH).set('deletingUserGroupIcon', API_REQUEST_STATE.FINISH);
        case UserGroupsAction.DELETE_USERGROUPICON_REJECTED:
            return state.set('updatingUserGroup', API_REQUEST_STATE.ERROR).set('deletingUserGroupIcon', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UserGroupsAction.DELETE_USERGROUPS:
            return state.set('deletingUserGroups', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case UserGroupsAction.DELETE_USERGROUPS_FULFILLED:
            for(let i = 0; i < action.payload.ids.length; i++) {
                indexes.push(userGroups.findIndex(function (group) {
                    return group.id === action.payload.ids[i];
                }));
            }
            if(indexes.length >= 0) {
                userGroups = userGroups.filter((u, key) => indexes.indexOf(key) === -1);
                return state.set('deletingUserGroups', false).set('userGroups', userGroups);
            }
            return state.set('deletingUserGroups', false);
        case UserGroupsAction.DELETE_USERGROUPS_REJECTED:
            return state.set('deletingUserGroups', false).set('isRejected', true).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as userGroups};