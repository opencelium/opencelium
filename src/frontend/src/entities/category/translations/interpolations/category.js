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
import { addCategory, deleteCategoryById, updateCategory } from "@entity/category/redux_toolkit/action_creators/CategoryCreators";

import Categories from "@entity/category/collections/Categories";

const ADD_CATEGORY = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    const categories = new Categories([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${addCategory[responseType].type}`}>
            The category <LinkMessage collectionName={categories.name} dispatch={dispatch} navigate={navigate} link={'categories'} message={name}/> was successfully added.
        </InterpolateTranslation>
    );
}
const UPDATE_CATEGORY = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    const categories = new Categories([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${updateCategory[responseType].type}`}>
            The category <LinkMessage collectionName={categories.name} dispatch={dispatch} navigate={navigate} link={'categories'} message={name}/> was successfully updated.
        </InterpolateTranslation>
    );
}
const DELETE_CATEGORY = (responseType, dispatch, navigate, params) => {
    const {name} = params;
    const categories = new Categories([], null);
    return (
        <InterpolateTranslation i18nKey={`notifications.${responseType}.${deleteCategoryById[responseType].type}`}>
            The category <LinkMessage collectionName={categories.name} dispatch={dispatch} navigate={navigate} message={name}/> was successfully removed.
        </InterpolateTranslation>
    );
}

export default {
    [getActionWithoutType(addCategory.fulfilled.type)]: ADD_CATEGORY,
    [getActionWithoutType(updateCategory.fulfilled.type)]: UPDATE_CATEGORY,
    [getActionWithoutType(deleteCategoryById.fulfilled.type)]: DELETE_CATEGORY,
}