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
import {addUserGroup, deleteUserGroupById, updateUserGroup} from "../../redux_toolkit/action_creators/UserGroupCreators";

const ADD_USER_GROUP = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addUserGroup[responseType].type}`}>
            The user group <LinkMessage dispatch={dispatch} navigate={navigate} link={'usergroups'} message={name}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_USER_GROUP = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateUserGroup[responseType].type}`}>
            The user group <LinkMessage dispatch={dispatch} navigate={navigate} link={'usergroups'} message={name}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_USER_GROUP = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteUserGroupById[responseType].type}`}>
            The user group <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> was successfully deleted.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addUserGroup.fulfilled.type)]: ADD_USER_GROUP,
    [getActionWithoutType(updateUserGroup.fulfilled.type)]: UPDATE_USER_GROUP,
    [getActionWithoutType(deleteUserGroupById.fulfilled.type)]: DELETE_USER_GROUP,
}