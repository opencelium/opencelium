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
import {getActionWithoutType} from "@application/utils/utils";
import {InterpolateTranslation} from "@app_component/base/interpolate_translation/InterpolateTranslation";
import LinkMessage from "@app_component/base/link_message/LinkMessage";
import {addInvoker, deleteInvokerByName, importInvoker, updateInvoker} from "../../redux_toolkit/action_creators/InvokerCreators";

const IMPORT_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${importInvoker[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} link={'invokers'} message={name}/> was successfully imported.
        </InterpolateTranslation>
    );
}
const ADD_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addInvoker[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} link={'invokers'} message={name}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateInvoker[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} link={'invokers'} message={name}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_INVOKER = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteInvokerByName[responseType].type}`}>
            The invoker <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(importInvoker.fulfilled.type)]: IMPORT_INVOKER,
    [getActionWithoutType(addInvoker.fulfilled.type)]: ADD_INVOKER,
    [getActionWithoutType(updateInvoker.fulfilled.type)]: UPDATE_INVOKER,
    [getActionWithoutType(deleteInvokerByName.fulfilled.type)]: DELETE_INVOKER,
};