import Request from "@entity/application/requests/classes/Request";
import {IRuleRequest} from "@root/requests/interfaces/IRule";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import {IResponse} from "@entity/invoker/interfaces/IResponse";
import {RuleBaseModel, RuleRecordModel} from "@root/requests/models/Rule";


export class RuleRequest extends Request implements IRuleRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connection', ...settings});
    }

    async createRule(rule: RuleBaseModel): Promise<AxiosResponse<RuleRecordModel>> {
        return super.post<RuleRecordModel>(rule);
    }

    async updateRule(rule: RuleRecordModel): Promise<AxiosResponse<IResponse>> {
        return super.put<IResponse>(rule);
    }

    async getRule(): Promise<AxiosResponse<RuleRecordModel>> {
        return super.get<RuleRecordModel>();
    }

    async getRulesByConnection(): Promise<AxiosResponse<RuleRecordModel[]>> {
        return super.get<RuleRecordModel[]>();
    }

    async deleteRule(): Promise<AxiosResponse<IResponse>> {
        return super.delete<IResponse>();
    }

    async deleteRulesByConnection(): Promise<AxiosResponse<IResponse>> {
        return super.delete<IResponse>();
    }

}
