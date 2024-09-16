/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import ActionCreators from "../../redux_toolkit/action_creators";
import {actions} from '../../redux_toolkit/slices/ApplicationSlice';

const {
    login, getResources, getVersion,
    updateResources, getGlobalSearchData, getAllComponents,
    addTicket, openExternalUrl, updateThemes,
    checkConnection, requestRemoteApi
} = ActionCreators;

const {setThemes} = actions;

export default {
    fulfilled: {
        [setThemes.type]: "Your theme was successfully updated",
        [getResources.fulfilled.type]: "New invokers and templates are available (<1><0>{{updates}}</0></1>)",
        [updateResources.fulfilled.type]: "",
    },
    rejected: {
        [login.rejected.type]: {
            "__DEFAULT__": "There is an error during the login",
            "UNSUPPORTED_HEADER_AUTH_TYPE": "Your session is expired",
            "Access Denied": "Your session is expired",
            "UNAUTHORIZED": "Wrong email or password",
            "Bad credentials": "Wrong email or password",
            "Network Error": "The server connection problem.",
            "NO_LICENSE": "Please, upload the license token to continue."
        },
        [checkConnection.rejected.type]: {
            "__DEFAULT__": "Your session has stopped. Please log in again or you will be log out."
        },
        [getResources.rejected.type]: {
            "__DEFAULT__": "The request of getting resources was rejected."
        },/*
        [requestRemoteApi.rejected.type]: {
            "__DEFAULT__": "The request was rejected."
        },*/
        [updateResources.rejected.type]: {
            "__DEFAULT__": ""
        },
        [updateThemes.rejected.type]: {
            "WRONG_REQUEST_BODY": "Wrong data to update thr themes",
            "USER_NOT_FOUND": "Wrong data to update the themes",
            "__DEFAULT__": "There is an error updating the themes",
        },
    },
}
