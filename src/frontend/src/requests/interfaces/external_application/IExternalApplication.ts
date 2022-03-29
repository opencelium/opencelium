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