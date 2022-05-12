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
import {InterpolateTranslation} from "@app_component/base/interpolate_translation/InterpolateTranslation";
import LinkMessage from "@app_component/base/link_message/LinkMessage";
import {getResources} from "../../redux_toolkit/action_creators/ApplicationCreators";
import {getActionWithoutType} from "../../utils/utils";

const GET_RESOURCES = (responseType, dispatch, navigate, params) => {
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${getResources[responseType].type}`}>
            New invokers and templates are available (<LinkMessage dispatch={dispatch} navigate={navigate} link={'update_subscription'} message={'updates'} shouldSetSearchValue={false}/>).
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(getResources.fulfilled.type)]: GET_RESOURCES,
}