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

import {UsersAction} from '../utils/actions';
import {
    fetchUserFulfilled, fetchUserRejected,
    fetchUsersFulfilled, fetchUsersRejected,
    checkUserEmailFulfilled, checkUserEmailRejected,
} from '../actions/users/fetch';
import {
    addUserFulfilled ,addUserRejected, addProfilePicture,
    addProfilePictureFulfilled, addProfilePictureRejected,
} from '../actions/users/add';
import {updateUserFulfilled, updateUserRejected,updateUserDetailFulfilled, updateUserDetailRejected,
    updateProfilePicture, updateProfilePictureFulfilled, updateProfilePictureRejected,
} from '../actions/users/update';
import {deleteUserFulfilled, deleteUserRejected} from '../actions/users/delete';
import {doRequest} from "../utils/auth";
import {isString} from "../utils/app";


/**
 * main url for users
 */
const urlPrefix = 'user';

/**
 * check user's email on existing
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const checkUserEmailEpic = (action$, store) => {
    return action$.ofType(UsersAction.CHECK_USEREMAIL)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/check/${action.payload.email}`;
            return doRequest({url},{
                success: checkUserEmailFulfilled,
                reject: checkUserEmailRejected,
            });
        });
};

/**
 * fetch one user by id
 */
const fetchUserEpic = (action$, store) => {
    return action$.ofType(UsersAction.FETCH_USER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url},{
                success: fetchUserFulfilled,
                reject: fetchUserRejected,
            });
        });
};

/**
 * fetch all users
 */
const fetchUsersEpic = (action$, store) => {
    return action$.ofType(UsersAction.FETCH_USERS)
        .debounceTime(500)
        .mergeMap((action) => {
            /*let storedUsers = store.getState().get('users').get('users');
            if(storedUsers.hasOwnProperty('size')){
                if(storedUsers.size > 0){
                    return Rx.Observable.of(fetchUsersInStore(storedUsers));
                }
            } else {
                if (storedUsers.length > 0) {
                    return Rx.Observable.of(fetchUsersInStore(storedUsers));
                }
            }*/
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: fetchUsersFulfilled,
                reject: fetchUsersRejected,
                cancel: action$.ofType(UsersAction.FETCH_USERS_CANCELED)
            });
        });
};

/**
 * add one user
 */
const addUserEpic = (action$, store) => {
    return action$.ofType(UsersAction.ADD_USER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let profilePicture = action.payload.userDetail.profilePicture;
            let data = {...action.payload};
            let successResponse = addUserFulfilled;
            if(data.userDetail.profilePicture !== null){
                successResponse = addProfilePicture;
            }
            delete data.userDetail.profilePicture;
            return doRequest({url, method: 'post', data: {...data}},{
                success: successResponse,
                reject: addUserRejected,},
                res => {
                    let result = res.response;
                    result.userDetail.profilePicture = profilePicture;
                    return result;
            });
        });
};

/**
 * add user's picture to the corresponded user
 */
const addProfilePictureEpic = (action$, store) => {
    return action$.ofType(UsersAction.ADD_PROFILEPICTURE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/profilePicture`;
            let data = new FormData();
            data.append('email', action.payload.email);
            data.append('file', action.payload.userDetail.profilePicture);
            return doRequest(
                {url, method: 'post', data, contentType: 'multipart/form-data'},{
                    success: addProfilePictureFulfilled,
                    reject: addProfilePictureRejected,
                },
                res => {return action.payload;}
            );
        });
};

/**
 * update one user
 */
const updateUserEpic = (action$, store) => {
    return action$.ofType(UsersAction.UPDATE_USER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            let profilePicture = action.payload.userDetail.profilePicture;
            let data = {...action.payload};
            let successResponse = updateUserFulfilled;
            if(data.userDetail.profilePicture !== null && !isString(data.userDetail.profilePicture)){
                successResponse = updateProfilePicture;
                delete data.userDetail.profilePicture;
            }
            return doRequest({url, method: 'put', data: {...data}},{
                success: successResponse,
                reject: updateUserRejected,},
                res => {let result = res.response; result.userDetail.profilePicture = profilePicture; return result;}
            );
        });
};

/**
 * update user's picture of the corresponded user
 */
const updateProfilePictureEpic = (action$, store) => {
    return action$.ofType(UsersAction.UPDATE_PROFILEPICTURE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/profilePicture`;
            let data = new FormData();
            data.append('email', action.payload.email);
            data.append('file', action.payload.userDetail.profilePicture);
            return doRequest({url, method: 'post', data, contentType: 'multipart/form-data'},{
                    success: updateProfilePictureFulfilled,
                    reject: updateProfilePictureRejected,},
                res => {return action.payload;}
            );
        });
};

/**
 * update user's details
 */
const updateUserDetailEpic = (action$, store) => {
    return action$.ofType(UsersAction.UPDATE_USERDETAIL)
        .debounceTime(500)
        .mergeMap((action) => {
            let data = action.payload;
            let url = `${urlPrefix}/${data.id}`;
            return doRequest({url, method: 'put', data: data.userDetail},{
                success: updateUserDetailFulfilled,
                reject: updateUserDetailRejected,},
                res => {return {...data.userDetail, id: data.id};}
            );
        });
};

/**
 * delete one user by id
 */
const deleteUserEpic = (action$, store) => {
    return action$.ofType(UsersAction.DELETE_USER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: 'delete'},{
                success: deleteUserFulfilled,
                reject: deleteUserRejected,},
                res => {return {...action.payload};}
            );
        });
};


export {
    fetchUserEpic,
    fetchUsersEpic,
    addUserEpic,
    updateUserEpic,
    updateUserDetailEpic,
    deleteUserEpic,
    addProfilePictureEpic,
    updateProfilePictureEpic,
    checkUserEmailEpic,
};