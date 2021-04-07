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

import {UsersAction} from '../utils/actions';
import { addUserSubscriber, updateUserSubscriber, deleteUserSubscriber, updateUserDetailSubscriber,} from '../utils/socket/users';

import {updateObj} from '../utils/app';
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    checkingUserEmail: false,
    checkEmailResult: null,
    userEmailData: {},
    fetchingUser: API_REQUEST_STATE.INITIAL,
    addingUser: API_REQUEST_STATE.INITIAL,
    addingProfilePicture: API_REQUEST_STATE.INITIAL,
    updatingProfilePicture: API_REQUEST_STATE.INITIAL,
    updatingUser: API_REQUEST_STATE.INITIAL,
    updatingUserDetail: API_REQUEST_STATE.INITIAL,
    fetchingUsers: API_REQUEST_STATE.INITIAL,
    deletingUser: API_REQUEST_STATE.INITIAL,
    user: null,
    users: List([]),
    error: null,
    message: {},
    notificationData: {},
});

let users = [];
let user = {};
let index = 0;

/**
 * redux reducer for users
 */
const reducer = (state = initialState, action) => {
    users = state.get('users');
    switch (action.type) {
        case UsersAction.CHECK_USEREMAIL:
            return state.set('checkingUserEmail', true).set('checkEmailResult', null).set('error', null);
        case UsersAction.CHECK_USEREMAIL_FULFILLED:
            return state.set('checkingUserEmail', false).set('checkEmailResult', action.payload);
        case UsersAction.CHECK_USEREMAIL_REJECTED:
            return state.set('checkingUserEmail', false).set('error', null).set('checkEmailResult', action.payload);
        case UsersAction.FETCH_USER:
            return state.set('fetchingUser', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.FETCH_USER_FULFILLED:
            return state.set('fetchingUser', API_REQUEST_STATE.FINISH).set('user', action.payload);
        case UsersAction.FETCH_USER_REJECTED:
            return state.set('fetchingUser', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.FETCH_USERS:
            return state.set('fetchingUsers', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.FETCH_USERS_STORE:
            return state.set('fetchingUsers', API_REQUEST_STATE.FINISH).set('users', List(action.payload));
        case UsersAction.FETCH_USERS_FULFILLED:
            return state.set('fetchingUsers', API_REQUEST_STATE.FINISH).set('users', List(action.payload));
        case UsersAction.FETCH_USERS_REJECTED:
            return state.set('fetchingUsers', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.FETCH_USERS_CANCELED:
            return state.set('fetchingUsers', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case UsersAction.ADD_USER_STORE:
            return state.set('users', users.set(users.size, action.payload));
        case UsersAction.ADD_USER:
            return state.set('addingUser', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.ADD_USER_FULFILLED:
            addUserSubscriber(action.payload);
            return state.set('addingUser', API_REQUEST_STATE.FINISH).set('users', users.set(users.size, action.payload));
        case UsersAction.ADD_USER_REJECTED:
            return state.set('addingUser', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.ADD_PROFILEPICTURE:
            return state.set('addingProfilePicture', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.ADD_PROFILEPICTURE_FULFILLED:
            addUserSubscriber(action.payload);
            return state.set('addingProfilePicture', API_REQUEST_STATE.FINISH).set('addingUser', API_REQUEST_STATE.FINISH).set('users', users.set(users.size, action.payload));
        case UsersAction.ADD_PROFILEPICTURE_REJECTED:
            return state.set('addingProfilePicture', API_REQUEST_STATE.ERROR).set('addingUser', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.UPDATE_PROFILEPICTURE:
            return state.set('updatingProfilePicture', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.UPDATE_PROFILEPICTURE_FULFILLED:
            updateUserSubscriber(action.payload);
            index = users.findIndex(function (user) {
                return user.id === action.payload.id;
            });
            if(index >= 0) {
                user = users.get(index);
                user.email = action.payload.email;
                return state.set('updatingUser', API_REQUEST_STATE.FINISH).set('updatingProfilePicture', API_REQUEST_STATE.FINISH).set('users', users.set(index, user));
            }
            return state.set('updatingUser', API_REQUEST_STATE.FINISH).set('updatingProfilePicture', API_REQUEST_STATE.FINISH);
        case UsersAction.UPDATE_PROFILEPICTURE_REJECTED:
            return state.set('updatingUser', API_REQUEST_STATE.ERROR).set('updatingProfilePicture', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.UPDATE_USER:
            return state.set('updatingUser', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.UPDATE_USER_FULFILLED:
            updateUserSubscriber(action.payload);
            index = users.findIndex(function (user) {
                return user.id === action.payload.id;
            });
            if(index >= 0) {
                user = action.payload;
                return state.set('updatingUser', API_REQUEST_STATE.FINISH).set('users', users.set(index, user));
            }
            return state.set('updatingUser', API_REQUEST_STATE.FINISH);
        case UsersAction.UPDATE_USER_REJECTED:
            return state.set('updatingUser', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.UPDATE_USERDETAIL:
            return state.set('updatingUserDetail', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.UPDATE_USERDETAIL_FULFILLED:
            updateUserDetailSubscriber(action.payload);
            index = users.findIndex(function (user) {
                return user.id === action.payload.id;
            });
            if(index >= 0) {
                user = users.get(index);
                user.userDetail = action.payload;
                return state.set('updatingUserDetail', API_REQUEST_STATE.FINISH).set('users', users.set(index, updateObj(user, 'userDetail', action.payload)));
            }
            return state.set('updatingUserDetail', API_REQUEST_STATE.FINISH);
        case UsersAction.UPDATE_USERDETAIL_REJECTED:
            return state.set('updatingUserDetail', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case UsersAction.DELETE_USER:
            return state.set('deletingUser', API_REQUEST_STATE.START).set('error', null);
        case UsersAction.DELETE_USER_FULFILLED:
            deleteUserSubscriber(action.payload);
            index = users.findIndex(function (user) {
                return user.id === action.payload.id;
            });
            if(index >= 0) {
                return state.set('deletingUser', API_REQUEST_STATE.FINISH).set('users', users.delete(index));
            }
            return state.set('deletingUser', API_REQUEST_STATE.FINISH);
        case UsersAction.DELETE_USER_REJECTED:
            return state.set('deletingUser', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        default:
            return state;
    }
};


export {initialState, reducer as users};