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

const {
    deleteApplicationFile, uploadApplicationFile, updateApplication,
    getOnlineUpdates, checkApplicationBeforeUpdate, getOfflineUpdates, checkForUpdates,
} = ActionCreators;


export default {
    fulfilled: {
        [checkForUpdates.fulfilled.type]: "OC Update <1><0>{{version}}</0></1> available",
        [uploadApplicationFile.fulfilled.type]: "New version was successfully uploaded",
        [deleteApplicationFile.fulfilled.type]: "The version was successfully removed",
        [updateApplication.fulfilled.type]: "Opencelium was successfully updated",
    },
    rejected: {
        [checkForUpdates.rejected.type]: {
            "__DEFAULT__": "OC Update available"
        },
        [uploadApplicationFile.rejected.type]: {
            "__DEFAULT__": "New version was not uploaded"
        },
        [deleteApplicationFile.rejected.type]: {
            "__DEFAULT__": "The version was not removed"
        },
        [updateApplication.rejected.type]: {
            "__DEFAULT__": "Opencelium was not updated"
        },
    },
}