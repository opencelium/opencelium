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

import { UsersAction } from '@utils/actions';


/**
 * check uniqueness of the email
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const checkUserEmail = (user) => {
    return {
        type: UsersAction.CHECK_USEREMAIL,
        payload: user,
    };
};

/**
 * check uniqueness of the email fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const checkUserEmailFulfilled = (user) => {
    return {
        type: UsersAction.CHECK_USEREMAIL_FULFILLED,
        payload: user,
    };
};

/**
 * check uniqueness of the email rejected
 * @param error
 * @returns {promise}
 */
const checkUserEmailRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.CHECK_USEREMAIL_REJECTED,
        payload: error
    });
};

/**
 * fetch user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const fetchUser = (user) => {
    return {
        type: UsersAction.FETCH_USER,
        payload: user,
    };
};

/**
 * fetch user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const fetchUserFulfilled = (user) => {
    return {
        type: UsersAction.FETCH_USER_FULFILLED,
        payload: user,
    };
};

/**
 * fetch user rejected
 * @param error
 * @returns {promise}
 */
const fetchUserRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.FETCH_USER_REJECTED,
        payload: error
    });
};

/**
 * fetch user canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchUserCanceled = (message) => {
    return {
        type: UsersAction.FETCH_USER_CANCELED,
        payload: message
    };
};

/**
 * fetch users
 * @returns {{type: string}}
 */
const fetchUsers = () => {
    return {
        type: UsersAction.FETCH_USERS
    };
};

/**
 * fill react store with users
 * @param users
 * @returns {{type: string, payload: []}}
 */
const fetchUsersInStore = (users) => {
    return{
        type: UsersAction.FETCH_USERS_STORE,
        payload: users
    };
};

/**
 * fetch users fulfilled
 * @param users
 * @returns {{type: string, payload: []}}
 */
const fetchUsersFulfilled = (users) => {
    return{
        type: UsersAction.FETCH_USERS_FULFILLED,
        payload: users
    };
};

/**
 * fetch users rejected
 * @param error
 * @returns {promise}
 */
const fetchUsersRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.FETCH_USERS_REJECTED,
        payload: error
    });
};

/**
 * fetch users canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchUsersCanceled = (message) => {
    return {
        type: UsersAction.FETCH_USERS_CANCELED,
        payload: message
    };
};

export {
    checkUserEmail,
    checkUserEmailFulfilled,
    checkUserEmailRejected,
    fetchUser,
    fetchUserFulfilled,
    fetchUserRejected,
    fetchUserCanceled,
    fetchUsers,
    fetchUsersFulfilled,
    fetchUsersRejected,
    fetchUsersCanceled,
    fetchUsersInStore,
};