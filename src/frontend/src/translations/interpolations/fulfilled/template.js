import React from "react";
import InterpolateTranslation from "../../InterpolateTranslation";
import LinkMessage from "@molecule/link_message/LinkMessage";
import {
    addTemplate,
    deleteTemplateById,
    exportTemplate,
    importTemplate,
    updateTemplate
} from "@action/connection/TemplateCreators";
import {getActionWithoutType} from "../../../utils";

const DELETE_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteTemplateById[responseType].type}`}>
            The template <LinkMessage dispatch={dispatch} navigate={navigate} message={name}/> was successfully removed.
        </InterpolateTranslation>
    );
}

const ADD_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name, connection} = params;
    const title = connection ? connection.title : '';
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addTemplate[responseType].type}`}>
            The template <LinkMessage dispatch={dispatch} navigate={navigate} link={'templates'} message={name}/> of the <LinkMessage dispatch={dispatch} navigate={navigate} link={'connections'} message={title}/> was successfully added.
        </InterpolateTranslation>
    );
}

const UPDATE_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateTemplate[responseType].type}`}>
            The template <LinkMessage dispatch={dispatch} navigate={navigate} link={'templates'} message={name}/> was successfully updated.
        </InterpolateTranslation>
    );
}

const IMPORT_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${importTemplate[responseType].type}`}>
            The template <LinkMessage dispatch={dispatch} navigate={navigate} link={'templates'} message={name}/> was successfully imported.
        </InterpolateTranslation>
    );
}

const EXPORT_TEMPLATE = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${exportTemplate[responseType].type}`}>
            The template <LinkMessage dispatch={dispatch} navigate={navigate} link={'templates'} message={name}/> was successfully downloaded.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(deleteTemplateById.fulfilled.type)]: DELETE_TEMPLATE,
    [getActionWithoutType(addTemplate.fulfilled.type)]: ADD_TEMPLATE,
    [getActionWithoutType(updateTemplate.fulfilled.type)]: UPDATE_TEMPLATE,
    [getActionWithoutType(importTemplate.fulfilled.type)]: IMPORT_TEMPLATE,
    [getActionWithoutType(exportTemplate.fulfilled.type)]: EXPORT_TEMPLATE,
}