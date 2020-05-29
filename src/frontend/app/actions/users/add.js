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
 * create a new user in Redux Store
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const addUserInStore = (user) => {
    return {
        type: UsersAction.ADD_USER_STORE,
        payload: user,
    };
};

/**
 * create a new user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const addUser = (user) => {
    return {
        type: UsersAction.ADD_USER,
        payload: user,
    };
};

/**
 * create a new user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const addUserFulfilled = (user) => {
    return {
        type: UsersAction.ADD_USER_FULFILLED,
        payload: user,
    };
};

/**
 * create a new user rejected
 * @param error
 * @returns {promise}
 */
const addUserRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.ADD_USER_REJECTED,
        payload: error
    });
};


/**
 * create a picture for the user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const addProfilePicture = (user) => {
    return {
        type: UsersAction.ADD_PROFILEPICTURE,
        payload: user,
    };
};

/**
 * create a picture for the user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const addProfilePictureFulfilled = (user) => {
    return {
        type: UsersAction.ADD_PROFILEPICTURE_FULFILLED,
        payload: user,
    };
};

/**
 * create a picture for the user rejected
 * @param error
 * @returns {promise}
 */
const addProfilePictureRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.ADD_PROFILEPICTURE_REJECTED,
        payload: error
    });
};


export{
    addUserInStore,
    addUser,
    addUserFulfilled,
    addUserRejected,
    addProfilePicture,
    addProfilePictureFulfilled,
    addProfilePictureRejected,
};