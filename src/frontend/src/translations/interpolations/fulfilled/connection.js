import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {addConnection, deleteConnectionById, updateConnection} from "@action/connection/ConnectionCreators";
import {getActionWithoutType} from "../../../utils";

const ADD_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addConnection[responseType].type}`}>
            The connection <LinkMessage dispatch={dispatch} navigate={navigate} link={'connections'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateConnection[responseType].type}`}>
            The connection <LinkMessage dispatch={dispatch} navigate={navigate} link={'connections'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteConnectionById[responseType].type}`}>
            The connection <LinkMessage dispatch={dispatch} navigate={navigate} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addConnection.fulfilled.type)]: ADD_CONNECTION,
    [getActionWithoutType(updateConnection.fulfilled.type)]: UPDATE_CONNECTION,
    [getActionWithoutType(deleteConnectionById.fulfilled.type)]: DELETE_CONNECTION,
}