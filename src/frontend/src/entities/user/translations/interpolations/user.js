/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React from "react";
import {getActionWithoutType} from "@application/utils/utils";
import {InterpolateTranslation} from "@app_component/base/interpolate_translation/InterpolateTranslation";
import LinkMessage from "@app_component/base/link_message/LinkMessage";
import {addUser, updateUser, deleteUserById} from "../../redux-toolkit/action_creators/UserCreators";

const ADD_USER = (responseType, dispatch, navigate, params) => {
    const {email} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addUser[responseType].type}`}>
            The user <LinkMessage dispatch={dispatch} navigate={navigate} link={'users'} message={email}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_USER = (responseType, dispatch, navigate, params) => {
    const {email} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateUser[responseType].type}`}>
            The user <LinkMessage dispatch={dispatch} navigate={navigate} link={'users'} message={email}/> was successfully updated.
        </InterpolateTranslation>
    );
}

const DELETE_USER = (responseType, dispatch, navigate, params) => {
    const {email} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteUserById[responseType].type}`}>
            The user <LinkMessage dispatch={dispatch} navigate={navigate} message={email}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addUser.fulfilled.type)]: ADD_USER,
    [getActionWithoutType(updateUser.fulfilled.type)]: UPDATE_USER,
    [getActionWithoutType(deleteUserById.fulfilled.type)]: DELETE_USER,
}