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

import {AxiosResponse} from "axios";

export enum ExternalApplicationStatus{
    UP= 'UP',
    DOWN= 'DOWN',
}

export interface ElasticSearchResponseProps {
    details: {version: string, error: string},
    status: ExternalApplicationStatus,
}
export interface DBResponseProps {
    details: {version: string, name: string, error?: string},
    status: ExternalApplicationStatus,
}

export interface ActuatorHealthResponseProps {
    components: {
        mariaDB: DBResponseProps,
        mongoDB: DBResponseProps,
    },
    status: ExternalApplicationStatus
}


export interface IExternalApplicationRequest {

    //to check elastic search status
    checkElasticsearch(): Promise<AxiosResponse<ElasticSearchResponseProps>>,

    //to check mongodb status
    checkMongoDB(): Promise<AxiosResponse<DBResponseProps>>,

    //to check statuses of all external applications
    checkAll(): Promise<AxiosResponse<ActuatorHealthResponseProps>>,
}
