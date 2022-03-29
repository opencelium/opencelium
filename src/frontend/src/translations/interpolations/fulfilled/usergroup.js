import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {addUserGroup, deleteUserGroupById, updateUserGroup} from "@action/UserGroupCreators";
import {getActionWithoutType} from "../../../utils";

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