import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {addNotification, deleteNotificationById, updateNotification} from "@action/schedule/NotificationCreators";
import {
    addSchedule,
    deleteScheduleById,
    startSchedule,
    switchScheduleStatus,
    updateSchedule
} from "@action/schedule/ScheduleCreators";
import {getActionWithoutType} from "../../../utils";

const ADD_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addSchedule[responseType].type}`}>
            The schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const ADD_SCHEDULE_NOTIFICATION = (responseType, dispatch, navigate, params) => {
    const {name, scheduleTitle} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addNotification[responseType].type}`}>
            The notification <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> of schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={scheduleTitle}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateSchedule[responseType].type}`}>
            The schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const UPDATE_SCHEDULE_NOTIFICATION = (responseType, dispatch, navigate, params) => {
    const {name, scheduleTitle} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateNotification[responseType].type}`}>
            The notification <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> of schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={scheduleTitle}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const SWITCH_SCHEDULE_STATUS = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${switchScheduleStatus[responseType].type}`}>
            The status of schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const START_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const title = params ? params.title : '';
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${startSchedule[responseType].type}`}>
            The schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully triggered.
        </InterpolateTranslation>
    );
}
const DELETE_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteScheduleById[responseType].type}`}>
            The schedule <LinkMessage dispatch={dispatch} navigate={navigate} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}
const DELETE_SCHEDULE_NOTIFICATION = (responseType, dispatch, navigate, params) => {
    const {name, scheduleTitle} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteNotificationById[responseType].type}`}>
            The notification <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> of schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={scheduleTitle}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addSchedule.fulfilled.type)]: ADD_SCHEDULE,
    [getActionWithoutType(updateSchedule.fulfilled.type)]: UPDATE_SCHEDULE,
    [getActionWithoutType(deleteScheduleById.fulfilled.type)]: DELETE_SCHEDULE,
    [getActionWithoutType(switchScheduleStatus.fulfilled.type)]: SWITCH_SCHEDULE_STATUS,
    [getActionWithoutType(startSchedule.fulfilled.type)]: START_SCHEDULE,
    [getActionWithoutType(addNotification.fulfilled.type)]: ADD_SCHEDULE_NOTIFICATION,
    [getActionWithoutType(updateNotification.fulfilled.type)]: UPDATE_SCHEDULE_NOTIFICATION,
    [getActionWithoutType(deleteNotificationById.fulfilled.type)]: DELETE_SCHEDULE_NOTIFICATION,
}