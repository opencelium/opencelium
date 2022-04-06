/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import {InterpolateTranslation} from "@atom/interpolate_translation/InterpolateTranslation";
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