import type { Invoker } from "./invoker";

export interface Connector {
    connectorId: number,
    title: string,
    timeout: number,
    sslCert: boolean,
    requestData: Record<string, string>,
    icon?: string | null,
    description?: string,
    invoker: Invoker,

}
