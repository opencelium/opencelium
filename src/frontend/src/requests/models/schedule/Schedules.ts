/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import ModelSchedule from "./Schedule";

//api description of schedule
export default interface Schedules extends ModelSchedule{
    connection: {
        connectionId: number;
        description: string;
        fromConnector: {
            connectorId: number;
            title: string;
        },
        title: string;
        toConnector: {
            connectorId: number;
            title: string;
        }
    },
    lastExecution: any,
    notification: any[],
}