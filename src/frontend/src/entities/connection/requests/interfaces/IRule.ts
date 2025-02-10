import {AxiosResponse} from "axios";
import {IResponse} from "@entity/invoker/interfaces/IResponse";
import {RuleBaseModel, RuleRecordModel} from "@root/requests/models/Rule";

export interface IRuleRequest {

    //to create rule
    createRule(rule: RuleBaseModel): Promise<AxiosResponse<RuleRecordModel>>,

    //to update rule
    updateRule(rule: RuleRecordModel): Promise<AxiosResponse<IResponse>>,

    //to get one rule
    getRule(): Promise<AxiosResponse<RuleRecordModel>>,

    //to get all rules by connection
    getRulesByConnection(): Promise<AxiosResponse<RuleRecordModel[]>>,

    //to delete rule
    deleteRule(): Promise<AxiosResponse<IResponse>>,

    deleteRulesByConnection(): Promise<AxiosResponse<IResponse>>,

}
