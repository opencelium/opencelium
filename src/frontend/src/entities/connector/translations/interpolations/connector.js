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
import {addConnector, deleteConnectorById, updateConnector, uploadConnectorImage} from "../../redux_toolkit/action_creators/ConnectorCreators";
import Connectors from "@entity/connector/collections/Connectors";


const ADD_CONNECTOR = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connectors = new Connectors([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addConnector[responseType].type}`}>
            The connector <LinkMessage collectionName={connectors.name} dispatch={dispatch} navigate={navigate} link={'connectors'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const ADD_CONNECTORICON = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connectors = new Connectors([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${uploadConnectorImage[responseType].type}`}>
            The icon of the connector <LinkMessage collectionName={connectors.name} dispatch={dispatch} navigate={navigate} link={'connectors'} message={title}/> was successfully uploaded.
        </InterpolateTranslation>
    );
}
const UPDATE_CONNECTOR = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connectors = new Connectors([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateConnector[responseType].type}`}>
            The connector <LinkMessage collectionName={connectors.name} dispatch={dispatch} navigate={navigate} link={'connectors'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_CONNECTOR = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    const connectors = new Connectors([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteConnectorById[responseType].type}`}>
            The connector <LinkMessage collectionName={connectors.name} dispatch={dispatch} navigate={navigate} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addConnector.fulfilled.type)]: ADD_CONNECTOR,
    [getActionWithoutType(uploadConnectorImage.fulfilled.type)]: ADD_CONNECTORICON,
    [getActionWithoutType(updateConnector.fulfilled.type)]: UPDATE_CONNECTOR,
    [getActionWithoutType(deleteConnectorById.fulfilled.type)]: DELETE_CONNECTOR,
}