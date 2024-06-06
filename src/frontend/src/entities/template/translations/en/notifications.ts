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
import {getTemplateByConnectionId} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";

const {
    deleteTemplateById, updateTemplate, importTemplate, exportTemplate, updateTemplates,
    deleteTemplatesById, addTemplate, getAllTemplates, getTemplateById,
} = ActionCreators;

export default {
    fulfilled: {
        [deleteTemplateById.fulfilled.type]: "The template <1><0>{{name}}</0></1> was successfully removed",
        [deleteTemplatesById.fulfilled.type]: "The selected templates were successfully removed",
        [addTemplate.fulfilled.type]: "The template <1><0>{{name}}</0></1> of the <3><0>{{title}}</0></3> was successfully added",
        [updateTemplate.fulfilled.type]: "The template <1><0>{{name}}</0></1> was successfully updated",
        [updateTemplates.fulfilled.type]: "The templates were successfully updated",
        [importTemplate.fulfilled.type]: "The Template <1><0>{{name}}</0></1> was successfully imported",
        [exportTemplate.fulfilled.type]: "The Template <1><0>{{name}}</0></1> was successfully downloaded",
        [getTemplateByConnectionId.fulfilled.type]: "The template was successfully downloaded",
    },
    rejected: {
        [deleteTemplateById.rejected.type]: {
            "__DEFAULT__": "The template was not removed"
        },
        [deleteTemplatesById.rejected.type]: {
            "__DEFAULT__": "The selected templates were not removed"
        },
        [getTemplateById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching template."
        },
        [getTemplateByConnectionId.rejected.type]: {
            "__DEFAULT__": "There is an error downloading a template by connection."
        },
        [getAllTemplates.rejected.type]: {
            "__DEFAULT__": "There is an error fetching templates."
        },
        [addTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not added"
        },
        [updateTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not updated"
        },
        [updateTemplates.rejected.type]: {
            "__DEFAULT__": "The templates were not updated"
        },
        [importTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not imported"
        },
        [exportTemplate.rejected.type]: {
            "__DEFAULT__": "The template was not downloaded"
        },
    },
}
