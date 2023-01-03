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
    addNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplateById,
    deleteNotificationTemplatesById, getNotificationTemplateById, getNotificationTemplatesByType, checkNotificationTemplateName, getAllNotificationTemplates
} = ActionCreators;

export default {
    fulfilled: {
        [addNotificationTemplate.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully added",
        [updateNotificationTemplate.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully updated",
        [deleteNotificationTemplateById.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully removed",
        [deleteNotificationTemplatesById.fulfilled.type]: "The selected templates were successfully removed",
    },
    rejected: {
        [getNotificationTemplateById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching notification template."
        },
        [getAllNotificationTemplates.rejected.type]: {
            "__DEFAULT__": "There is an error fetching notification templates."
        },
        [addNotificationTemplate.rejected.type]: {
            "__DEFAULT__": "The notification was not added"
        },
        [updateNotificationTemplate.rejected.type]: {
            "__DEFAULT__": "The notification was not updated"
        },
        [deleteNotificationTemplateById.rejected.type]: {
            "__DEFAULT__": "The notification was not removed"
        },
        [deleteNotificationTemplatesById.rejected.type]: {
            "__DEFAULT__": "The selected templates were not removed"
        },
    },
}