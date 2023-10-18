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
import LinkMessage from "@app_component/base/link_message/LinkMessage";
import {InterpolateTranslation} from "@app_component/base/interpolate_translation/InterpolateTranslation";
import {
    addConnection, deleteConnectionById, updateConnection,
    getAndUpdateConnectionTitle,
} from "../../redux_toolkit/action_creators/ConnectionCreators";
import Connections from "@root/collections/Connections";

const ADD_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connections = new Connections([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addConnection[responseType].type}`}>
            The connection <LinkMessage collectionName={connections.name} dispatch={dispatch} navigate={navigate} link={'connections'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connections = new Connections([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateConnection[responseType].type}`}>
            The connection <LinkMessage collectionName={connections.name} dispatch={dispatch} navigate={navigate} link={'connections'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const GET_AND_UPDATE_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connections = new Connections([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${getAndUpdateConnectionTitle[responseType].type}`}>
            The connection <LinkMessage collectionName={connections.name} dispatch={dispatch} navigate={navigate} link={'connections'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_CONNECTION = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connections = new Connections([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteConnectionById[responseType].type}`}>
            The connection <LinkMessage collectionName={connections.name} dispatch={dispatch} navigate={navigate} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addConnection.fulfilled.type)]: ADD_CONNECTION,
    [getActionWithoutType(updateConnection.fulfilled.type)]: UPDATE_CONNECTION,
    [getActionWithoutType(getAndUpdateConnectionTitle.fulfilled.type)]: GET_AND_UPDATE_CONNECTION,
    [getActionWithoutType(deleteConnectionById.fulfilled.type)]: DELETE_CONNECTION,
}
