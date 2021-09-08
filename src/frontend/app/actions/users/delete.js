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

import Rx from 'rxjs/Rx';

import { UsersAction } from '@utils/actions';


/**
 * delete user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const deleteUser = (user) => {
    return {
        type: UsersAction.DELETE_USER,
        payload: user,
    };
};

/**
 * delete user fulfilled
 * @param data
 * @returns {{type: string, payload: {}}}
 */
const deleteUserFulfilled = (data) => {
    return {
        type: UsersAction.DELETE_USER_FULFILLED,
        payload: data,
    };
};

/**
 * delete user rejected
 * @param error
 * @returns {promise}
 */
const deleteUserRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.DELETE_USER_REJECTED,
        payload: error
    });
};

/**
 * delete users
 * @param users
 * @returns {{type: string, payload: {}}}
 */
const deleteUsers = (users) => {
    return {
        type: UsersAction.DELETE_USERS,
        payload: users,
    };
};

/**
 * delete users fulfilled
 * @param data
 * @returns {{type: string, payload: {}}}
 */
const deleteUsersFulfilled = (data) => {
    return {
        type: UsersAction.DELETE_USERS_FULFILLED,
        payload: data,
    };
};

/**
 * delete users rejected
 * @param error
 * @returns {promise}
 */
const deleteUsersRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.DELETE_USERS_REJECTED,
        payload: error
    });
};


export{
    deleteUser,
    deleteUserFulfilled,
    deleteUserRejected,
    deleteUsers,
    deleteUsersFulfilled,
    deleteUsersRejected,
};