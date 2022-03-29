import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {deleteWebhook, getWebhook} from "@action/schedule/WebhookCreators";
import {getActionWithoutType} from "../../../utils";

const ADD_WEBHOOK = (responseType, dispatch, navigate, params) => {
    const title = params.schedule ? params.schedule.title : '';
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${getWebhook[responseType].type}`}>
            The webhook of schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const DELETE_WEBHOOK = (responseType, dispatch, navigate, params) => {
    const title = params.schedule ? params.schedule.title : '';
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteWebhook[responseType].type}`}>
            The schedule of schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}/*

const COPYTOCLIPBOARD_WEBHOOK = (responseType, dispatch, navigate, params) => {
    const title = params && params.schedule ? params.schedule.title : '';
    const openPage = () => {
        navigateTo('schedules');
    }
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${getWebhook[responseType].type}`}>
            The webhook of schedule <LinkMessage dispatch={dispatch} navigate={navigate} onClick={openPage} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}*/

export default {
    [getActionWithoutType(getWebhook.fulfilled.type)]: ADD_WEBHOOK,
    [getActionWithoutType(deleteWebhook.fulfilled.type)]: DELETE_WEBHOOK,
    //COPYTOCLIPBOARD_WEBHOOK,
}