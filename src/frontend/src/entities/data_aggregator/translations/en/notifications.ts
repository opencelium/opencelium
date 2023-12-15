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
    addAggregator, updateAggregator, archiveAggregatorById,
    unarchiveAggregatorById, getAggregatorById, getAllAggregators,
} = ActionCreators;

export default {
    fulfilled: {
        [addAggregator.fulfilled.type]: "The aggregator was successfully added.",
        [updateAggregator.fulfilled.type]: "The aggregator was successfully updated.",
        [archiveAggregatorById.fulfilled.type]: "The aggregator was successfully archived.",
        [unarchiveAggregatorById.fulfilled.type]: "The aggregator was successfully unarchived.",
    },
    rejected: {
        [addAggregator.rejected.type]: "There is an error adding aggregator.",
        [updateAggregator.rejected.type]: "There is an error updating aggregator.",
        [archiveAggregatorById.rejected.type]: "There is an error archiving aggregator.",
        [unarchiveAggregatorById.rejected.type]: "There is an error unarchiving aggregator.",
        [getAggregatorById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching aggregator."
        },
        [getAllAggregators.rejected.type]: {
            "__DEFAULT__": "There is an error fetching aggregators."
        },
    },
}
