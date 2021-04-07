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
 * update user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateUser = (user) => {
    return {
        type: UsersAction.UPDATE_USER,
        payload: user,
    };
};

/**
 * update user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateUserFulfilled = (user) => {
    return {
        type: UsersAction.UPDATE_USER_FULFILLED,
        payload: user,
    };
};

/**
 * update user rejected
 * @param error
 * @returns {promise}
 */
const updateUserRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.UPDATE_USER_REJECTED,
        payload: error
    });
};

/**
 * update picture of the user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateProfilePicture = (user) => {
    return {
        type: UsersAction.UPDATE_PROFILEPICTURE,
        payload: user,
    };
};

/**
 * update picture of the user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateProfilePictureFulfilled = (user) => {
    return {
        type: UsersAction.UPDATE_PROFILEPICTURE_FULFILLED,
        payload: user,
    };
};

/**
 * update picture of the user rejected
 * @param error
 * @returns {promise}
 */
const updateProfilePictureRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.UPDATE_PROFILEPICTURE_REJECTED,
        payload: error
    });
};

/**
 * update user details fulfilled
 * @param userDetail
 * @returns {{type: string, payload: {}}}
 */
const updateUserDetailFulfilled = (userDetail) => {
    return {
        type: UsersAction.UPDATE_USERDETAIL_FULFILLED,
        payload: userDetail,
    };
};

/**
 * update user details rejected
 * @param error
 * @returns {promise}
 */
const updateUserDetailRejected = (error) => {
    return Rx.Observable.of({
        type: UsersAction.UPDATE_USERDETAIL_REJECTED,
        payload: error
    });
};



export{
    updateUser,
    updateUserFulfilled,
    updateUserRejected,
    updateUserDetailFulfilled,
    updateUserDetailRejected,
    updateProfilePicture,
    updateProfilePictureFulfilled,
    updateProfilePictureRejected,
};