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

import {AxiosResponse} from "axios";

export enum ExternalApplicationStatus{
    UP= 'UP',
    DOWN= 'DOWN',
}

export interface ElasticSearchResponseProps{
    details: {version: string, error: string},
    status: ExternalApplicationStatus,
}

export interface Neo4jResponseProps{
    details: {version: string, nodes: number},
    status: ExternalApplicationStatus,
}

export interface ActuatorHealthResponseProps{
    details:{
        elasticsearch: ElasticSearchResponseProps,
        neo4j: Neo4jResponseProps,
    },
    status: ExternalApplicationStatus
}


export interface IExternalApplicationRequest{

    //to check neo4j status
    checkNeo4j(): Promise<AxiosResponse<Neo4jResponseProps>>,

    //to check elastic search status
    checkElasticsearch(): Promise<AxiosResponse<ElasticSearchResponseProps>>,

    //to check statuses of all external applications
    checkAll(): Promise<AxiosResponse<ActuatorHealthResponseProps>>,
}