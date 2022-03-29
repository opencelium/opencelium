import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {
    ElasticSearchResponseProps,
    IExternalApplicationRequest
} from "../../interfaces/external_application/IExternalApplication";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {
    ActuatorHealthResponseProps,
    Neo4jResponseProps
} from "../../interfaces/external_application/IExternalApplication";


export class ExternalApplicationRequest extends Request implements IExternalApplicationRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'actuator/health', ...settings});
    }

    async checkNeo4j(): Promise<AxiosResponse<Neo4jResponseProps>>{
        this.endpoint = '/neo4j';
        return super.get<Neo4jResponseProps>();
    }

    async checkElasticsearch(): Promise<AxiosResponse<ElasticSearchResponseProps>>{
        this.endpoint = '/elasticsearch';
        return super.get<ElasticSearchResponseProps>();
    }

    async checkAll(): Promise<AxiosResponse<ActuatorHealthResponseProps>>{
        return super.get<ActuatorHealthResponseProps>();
    }
}