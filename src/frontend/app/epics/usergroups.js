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

import {UserGroupsAction} from '@utils/actions';
import {
    fetchUserGroupFulfilled, fetchUserGroupRejected,
    fetchUserGroupsFulfilled, fetchUserGroupsRejected,
    checkUserGroupNameFulfilled, checkUserGroupNameRejected,
} from '@actions/usergroups/fetch';
import {
    addUserGroupFulfilled, addUserGroupRejected,
    addGroupIcon, addGroupIconFulfilled, addGroupIconRejected,
} from '@actions/usergroups/add';
import {
    updateUserGroupFulfilled, updateUserGroupRejected,
    updateGroupIcon, updateGroupIconFulfilled, updateGroupIconRejected,
} from '@actions/usergroups/update';
import {
    deleteUserGroupFulfilled, deleteUserGroupRejected,
    deleteUserGroupIcon, deleteUserGroupIconFulfilled, deleteUserGroupIconRejected,
} from '@actions/usergroups/delete';
import {doRequest} from "@utils/auth";
import {isString} from "@utils/app";
import {API_METHOD} from "@utils/constants/app";


/**
 * main url for usergroups
 */
const urlPrefix = 'role';

/**
 * fetch one usergroup by id
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchUserGroupEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.FETCH_USERGROUP)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url},{
                success: fetchUserGroupFulfilled,
                reject: fetchUserGroupRejected,
            });
        });
};

/**
 * fetch all usergroups
 */
const fetchUserGroupsEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.FETCH_USERGROUPS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: (data) => fetchUserGroupsFulfilled(data, action.settings),
                reject: fetchUserGroupsRejected,
                cancel: action$.ofType(UserGroupsAction.FETCH_USERGROUPS_CANCELED),
            });
        });
};

/**
 * check userGroup's name on existing
 */
const checkUserGroupNameEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.CHECK_USERGROUPNAME)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/exists/${action.payload.role}`;
            return doRequest({url},{
                success: checkUserGroupNameFulfilled,
                reject: checkUserGroupNameRejected,
            });
        });
};
/**
 * add one usergroup
 */
const addUserGroupEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.ADD_USERGROUP)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = {...action.payload};
            let successResponse = addUserGroupFulfilled;
            if(data.icon !== null && data.icon !== ''){
                successResponse = addGroupIcon;
            }
            delete data.icon;
            return doRequest({url, method: API_METHOD.POST, data},{
                success: successResponse,
                reject: addUserGroupRejected,},
                res => {let result = res.response; result.icon = action.payload.icon; return result;}
            );
        });
};

/**
 * add usergroup icon to the corresponded usergroup
 */
const addGroupIconEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.ADD_GROUPICON)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/groupIcon`;
            let data = new FormData();
            data.append('userGroupId', action.payload.groupId);
            data.append('file', action.payload.icon);
            return doRequest({url, method: API_METHOD.POST, data, contentType: 'multipart/form-data'},{
                    success: addGroupIconFulfilled,
                    reject: addGroupIconRejected,},
                res => {return action.payload;}
            );
        });
};

/**
 * update one usergroup
 */
const updateUserGroupEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.UPDATE_USERGROUP)
        .debounceTime(500)
        .mergeMap((action) => {
            let data = {...action.payload};
            let url = `${urlPrefix}/${data.id}`;
            let successResponse = updateUserGroupFulfilled;
            if(data.icon !== null && !isString(data.icon)){
                successResponse = updateGroupIcon;
                delete data.icon;
            }
            if(data.shouldDeleteImage){
                successResponse = deleteUserGroupIcon;
                delete data.icon;
            }
            return doRequest({url, method: API_METHOD.PUT, data},{
                    success: successResponse,
                    reject: updateUserGroupRejected,},
                res => {let result = res.response; result.icon = action.payload.icon; return result;}
            );
        });
};

/**
 * update one usergroup icon
 */
const updateGroupIconEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.UPDATE_GROUPICON)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `storage/groupIcon`;
            let data = new FormData();
            data.append('userGroupId', action.payload.groupId);
            data.append('file', action.payload.icon);
            return doRequest({url, method: API_METHOD.POST, data, contentType: 'multipart/form-data'},{
                    success: updateGroupIconFulfilled,
                    reject: updateGroupIconRejected,},
                res => {return action.payload;}
            );
        });
};

/**
 * delete one usergroup by id
 */
const deleteUserGroupEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.DELETE_USERGROUP)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteUserGroupFulfilled,
                    reject: deleteUserGroupRejected,},
                res => {return {...action.payload};}
            );
        });
};

/**
 * delete one usergroup icon by usergroup id
 */
const deleteUserGroupIconEpic = (action$, store) => {
    return action$.ofType(UserGroupsAction.DELETE_USERGROUPICON)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.groupId}/icon`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteUserGroupIconFulfilled,
                    reject: deleteUserGroupIconRejected,},
                res => {return {...action.payload};}
            );
        });
};


export {
    fetchUserGroupEpic,
    fetchUserGroupsEpic,
    checkUserGroupNameEpic,
    addUserGroupEpic,
    updateUserGroupEpic,
    deleteUserGroupEpic,
    addGroupIconEpic,
    updateGroupIconEpic,
    deleteUserGroupIconEpic,
};