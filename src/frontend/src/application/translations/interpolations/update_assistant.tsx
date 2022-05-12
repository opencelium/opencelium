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
import {NavigateFunction} from "react-router";
import {checkForUpdates} from "@entity/update_assistant/redux_toolkit/action_creators/UpdateAssistantCreators";
import LinkMessage from "@app_component/base/link_message/LinkMessage";
import InterpolateTranslation from "@app_component/base/interpolate_translation/InterpolateTranslation";
import {IApplicationResponse} from "../../requests/interfaces/IResponse";
import {CheckForUpdateProps} from "../../requests/interfaces/IUpdateAssistant";
import {NotificationType} from "../../interfaces/INotification";
import {getActionWithoutType} from "../../utils/utils";
import {AppDispatch} from "../../utils/store";

const GET_LAST_AVAILABLE_VERSION = (responseType: NotificationType, dispatch: AppDispatch, navigate: NavigateFunction, params: IApplicationResponse<CheckForUpdateProps>) => {
    // @ts-ignore
    return (<InterpolateTranslation i18nKey={`notifications.${responseType}.${checkForUpdates[responseType].type}`}>
            OC Update <LinkMessage dispatch={dispatch} navigate={navigate} link={'update_assistant'} message={params.data.version} shouldSetSearchValue={false}/> available.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(checkForUpdates.fulfilled.type)]: GET_LAST_AVAILABLE_VERSION,
}