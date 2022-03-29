import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {
    addNotificationTemplate,
    deleteNotificationTemplateById,
    updateNotificationTemplate
} from "@action/schedule/NotificationTemplateCreators";
import {getActionWithoutType} from "../../../utils";

const ADD_NOTIFICATION_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addNotificationTemplate[responseType].type}`}>
            The notification template <LinkMessage dispatch={dispatch} navigate={navigate} link={'notification_templates'} message={name}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_NOTIFICATION_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateNotificationTemplate[responseType].type}`}>
            The notification template <LinkMessage dispatch={dispatch} navigate={navigate} link={'notification_templates'} message={name}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_NOTIFICATION_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteNotificationTemplateById[responseType].type}`}>
            The notification template <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addNotificationTemplate.fulfilled.type)]: ADD_NOTIFICATION_TEMPLATE,
    [getActionWithoutType(updateNotificationTemplate.fulfilled.type)]: UPDATE_NOTIFICATION_TEMPLATE,
    [getActionWithoutType(deleteNotificationTemplateById.fulfilled.type)]: DELETE_NOTIFICATION_TEMPLATE,
}