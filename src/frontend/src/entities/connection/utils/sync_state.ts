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

import {
    setArrows, setConnectionData,
    setCurrentTechnicalItem, setDetailsLocation,
    setItems, addCurrentLog, clearCurrentLogs,
} from "../redux_toolkit/slices/ConnectionSlice";

const whiteList = [
    setItems.type,
    setArrows.type,
    setCurrentTechnicalItem.type,
    setDetailsLocation.type,
    setConnectionData.type,
    addCurrentLog.type,
    clearCurrentLogs.type,
]

export {
    whiteList,
}