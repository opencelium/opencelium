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
import {
    addTemplate,
    deleteTemplateById,
    exportTemplate,
    importTemplate,
    updateTemplate
} from "../../redux_toolkit/action_creators/TemplateCreators";

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