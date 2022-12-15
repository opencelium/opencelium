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
import {addNotification, deleteNotificationById, updateNotification} from "../../redux_toolkit/action_creators/NotificationCreators";
import {
    addSchedule,
    deleteScheduleById,
    startSchedule,
    switchScheduleStatus,
    updateSchedule
} from "../../redux_toolkit/action_creators/ScheduleCreators";
import Schedules from "@entity/schedule/collections/Schedules";

const ADD_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addSchedule[responseType].type}`}>
            The schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const ADD_SCHEDULE_NOTIFICATION = (responseType, dispatch, navigate, params) => {
    const {name, scheduleTitle} = params;
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addNotification[responseType].type}`}>
            The notification <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> of schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={scheduleTitle}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateSchedule[responseType].type}`}>
            The schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const UPDATE_SCHEDULE_NOTIFICATION = (responseType, dispatch, navigate, params) => {
    const {name, scheduleTitle} = params;
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateNotification[responseType].type}`}>
            The notification <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> of schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={scheduleTitle}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const SWITCH_SCHEDULE_STATUS = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${switchScheduleStatus[responseType].type}`}>
            The status of schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const START_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const title = params ? params.title : '';
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${startSchedule[responseType].type}`}>
            The schedule <LinkMessage dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully triggered.
        </InterpolateTranslation>
    );
}
const DELETE_SCHEDULE = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteScheduleById[responseType].type}`}>
            The schedule <LinkMessage dispatch={dispatch} navigate={navigate} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}
const DELETE_SCHEDULE_NOTIFICATION = (responseType, dispatch, navigate, params) => {
    const {name, scheduleTitle} = params;
    const schedules = new Schedules([], null);
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