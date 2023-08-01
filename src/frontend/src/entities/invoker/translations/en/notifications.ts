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
    importInvoker, addInvoker, updateInvoker, uploadInvokerImage, deleteInvokerByName,
    deleteInvokersByName, getAllInvokers, checkInvokerName, deleteInvokerImage, getInvokerByName,
    updateOperation,
} = ActionCreators;

export default {
    fulfilled: {
        [addInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully added.",
        [importInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully imported.",
        [deleteInvokerByName.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully removed",
        [deleteInvokersByName.fulfilled.type]: "The selected invokers were successfully removed",
        [updateInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully updated",
        [uploadInvokerImage.fulfilled.type]: "The image of the invoker <1><0>{{name}}</0></1> was successfully uploaded.",
    },
    rejected: {
        [updateOperation.rejected.type]: {
            "__DEFAULT__": "The invoker operation was not updated."
        },
        [getInvokerByName.rejected.type]: {
            "__DEFAULT__": "There is an error fetching invoker."
        },
        [getAllInvokers.rejected.type]: {
            "__DEFAULT__": "There is an error fetching invokers."
        },
        [addInvoker.rejected.type]: {
            "__DEFAULT__": "The invoker was not added.",
            "EXISTS": "Invoker with such name is already in use.",
        },
        [importInvoker.rejected.type]: {
            "__DEFAULT__": "The invoker was not imported."
        },
        [deleteInvokerByName.rejected.type]: {
            "__DEFAULT__": "The invoker was not removed."
        },
        [deleteInvokersByName.rejected.type]: {
            "__DEFAULT__": "The selected invokers were not removed."
        },
        [updateInvoker.rejected.type]: {
            "__DEFAULT__": "The invoker was not updated."
        },
        [uploadInvokerImage.rejected.type]: {
            "__DEFAULT__": "The image of the invoker was not uploaded."
        },
    },
}
