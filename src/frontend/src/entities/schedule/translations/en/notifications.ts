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

import ActionCreators from "../../redux_toolkit/action_creators";
import {actions} from '../../redux_toolkit/slices/ScheduleSlice';

const {
    addSchedule, disableSchedules, enableSchedules, switchScheduleStatus, startSchedule, deleteScheduleById,
    updateSchedule, startSchedules, deleteSchedulesById, getCurrentSchedules, getSchedulesById,
    checkScheduleTitle, getScheduleById, getAllSchedules, deleteWebhook, getWebhook,
} = ActionCreators;

const {
    copyWebhookToClipboard,
} = actions;

export default {
    fulfilled: {
        [addSchedule.fulfilled.type]: "The schedule <1><0>{{title}}</0></1> was successfully added",
        [deleteScheduleById.fulfilled.type]: "The schedule <1><0>{{title}}</0></1> was successfully removed",
        [updateSchedule.fulfilled.type]: "The schedule <1><0>{{title}}</0></1> was successfully updated",
        [switchScheduleStatus.fulfilled.type]: "The status of the job <1><0>{{title}}</0></1> was successfully updated",
        [enableSchedules.fulfilled.type]: "The selected schedules were successfully enabled",
        [disableSchedules.fulfilled.type]: "The selected schedules were successfully disabled",
        [startSchedules.fulfilled.type]: "The selected schedules were successfully started",
        [deleteSchedulesById.fulfilled.type]: "The selected schedules were successfully removed",
        [getWebhook.fulfilled.type]: "The webhook of the job <1><0>{{name}}</0></1> was successfully created",
        [deleteWebhook.fulfilled.type]: "The webhook of the job <1><0>{{name}}</0></1> was successfully removed",
        [startSchedule.fulfilled.type]: "The job <1><0>{{title}}</0></1> was successfully triggered",
        [copyWebhookToClipboard.type]: "The webhook was successfully copied",

    },
    rejected: {
        [addSchedule.rejected.type]: {
            "__DEFAULT__": "The schedule was not added"
        },
        [deleteScheduleById.rejected.type]: {
            "__DEFAULT__": "The schedule was not removed"
        },
        [updateSchedule.rejected.type]: {
            "__DEFAULT__": "The schedule was not updated"
        },
        [switchScheduleStatus.rejected.type]: {
            "__DEFAULT__": "The status of the job was not updated"
        },
        [enableSchedules.rejected.type]: {
            "__DEFAULT__": "The selected schedules were not enabled"
        },
        [disableSchedules.rejected.type]: {
            "__DEFAULT__": "The selected schedules were not disabled"
        },
        [startSchedules.rejected.type]: {
            "__DEFAULT__": "The selected schedules were not started"
        },
        [deleteSchedulesById.rejected.type]: {
            "__DEFAULT__": "The selected schedules were not removed"
        },
        [getWebhook.rejected.type]: {
            "__DEFAULT__": "The webhook of the job was not created"
        },
        [deleteWebhook.rejected.type]: {
            "__DEFAULT__": "The webhook of the job was not removed"
        },
        [getScheduleById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching schedule."
        },
        [getSchedulesById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching schedules."
        },
        [startSchedule.rejected.type]: {
            "__DEFAULT__": "The job was not triggered"
        },
    },
}