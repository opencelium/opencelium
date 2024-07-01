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

import ActionCreators from "../../redux_toolkit/action_creators";

const {
  addCategory, updateCategory, deleteCategoryById,
  deleteCategoriesById, getCategoryById, getAllCategories
} = ActionCreators;

export default {
  fulfilled: {
    [addCategory.fulfilled.type]: "The category <1><0>{{name}}</0></1> was successfully added",
    [updateCategory.fulfilled.type]: "The category <1><0>{{name}}</0></1> was successfully updated",
    [deleteCategoryById.fulfilled.type]: "The category <1><0>{{name}}</0></1> was successfully removed",
    [deleteCategoriesById.fulfilled.type]: "The selected categories were successfully removed",
  },
  rejected: {
    [getCategoryById.rejected.type]: {
      "__DEFAULT__": "There is an error fetching category."
    },
    [getAllCategories.rejected.type]: {
      "__DEFAULT__": "There is an error fetching categories."
    },
    [addCategory.rejected.type]: {
      "__DEFAULT__": "The category was not added"
    },
    [updateCategory.rejected.type]: {
      "__DEFAULT__": "The category was not updated"
    },
    [deleteCategoryById.rejected.type]: {
      "__DEFAULT__": "The category was not removed"
    },
    [deleteCategoriesById.rejected.type]: {
      "__DEFAULT__": "The selected categories were not removed"
    },
  },
}