import {APIResponseType} from "@app_component/operator_builder/reference_generator/props";

export type SourceType = 'request' | 'response';
export interface DirectReferenceData {
    color: string,
    type: SourceType,
    apiResponseType: APIResponseType,
    field: string,
}
export interface WebhookReferenceData {
    name: string,
    type: string,
}
