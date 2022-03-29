import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import {addUser, deleteUserById, updateUser} from "@action/UserCreators";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {getActionWithoutType} from "../../../utils";

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