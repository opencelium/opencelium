import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import {addConnector, deleteConnectorById, updateConnector, uploadConnectorImage} from "@action/ConnectorCreators";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {getActionWithoutType} from "../../../utils";


const ADD_CONNECTOR = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addConnector[responseType].type}`}>
            The connector <LinkMessage dispatch={dispatch} navigate={navigate} link={'connectors'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}
const ADD_CONNECTORICON = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${uploadConnectorImage[responseType].type}`}>
            The icon of the connector <LinkMessage dispatch={dispatch} navigate={navigate} link={'connectors'} message={title}/> was successfully uploaded.
        </InterpolateTranslation>
    );
}
const UPDATE_CONNECTOR = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateConnector[responseType].type}`}>
            The connector <LinkMessage dispatch={dispatch} navigate={navigate} link={'connectors'} message={title}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_CONNECTOR = (responseType, dispatch, navigate, params) => {
    const {title} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteConnectorById[responseType].type}`}>
            The connector <LinkMessage dispatch={dispatch} navigate={navigate} message={title}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addConnector.fulfilled.type)]: ADD_CONNECTOR,
    [getActionWithoutType(uploadConnectorImage.fulfilled.type)]: ADD_CONNECTORICON,
    [getActionWithoutType(updateConnector.fulfilled.type)]: UPDATE_CONNECTOR,
    [getActionWithoutType(deleteConnectorById.fulfilled.type)]: DELETE_CONNECTOR,
}