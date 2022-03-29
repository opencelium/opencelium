import {ExternalApplicationStatus} from "@requestInterface/external_application/IExternalApplication";

export interface IExternalApplication{
    id: number,
    name: string,
    link: string,
    icon: string,
    value: string,
    status?: ExternalApplicationStatus,
}