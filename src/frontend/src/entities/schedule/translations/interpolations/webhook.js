/*
 *  Copyright (C) <2023>  <becon GmbH>
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
import {deleteWebhook, getWebhook} from "../../redux_toolkit/action_creators/WebhookCreators";
import Schedules from "@entity/schedule/collections/Schedules";

const ADD_WEBHOOK = (responseType, dispatch, navigate, params) => {
    const title = params.schedule ? params.schedule.title : '';
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${getWebhook[responseType].type}`}>
            The webhook of schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const DELETE_WEBHOOK = (responseType, dispatch, navigate, params) => {
    const title = params.schedule ? params.schedule.title : '';
    const schedules = new Schedules([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteWebhook[responseType].type}`}>
            The webhook of schedule <LinkMessage collectionName={schedules.name} dispatch={dispatch} navigate={navigate} link={'schedules'} message={title}/> was successfully removed.
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