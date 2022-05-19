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
    checkNeo4j, checkElasticsearch, checkAllExternalApplications
} = ActionCreators;

export default {
    fulfilled: {
    },
    rejected: {
        [checkNeo4j.rejected.type]: {
            "DOWN": "Neo4j is down",
            "__DEFAULT__": "Neo4j could not be checked"
        },
        [checkElasticsearch.rejected.type]: {
            "DOWN": "Elasticsearch is down",
            "__DEFAULT__": "Neo4j could not be checked"
        },
    },
}