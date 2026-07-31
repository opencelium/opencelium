import type { MainResponse, MethodRequest, MethodResponse } from "./connection";

export interface Invoker {
    name: string,
    description: string,
    authType: 'basic' | 'token',
    hasManualSync: boolean,
    hint: string,
    icon?: string | null,
    requiredData: Record<string, string>,
    operations: Operation[],
}

export interface Operation {
    name: string,
    type: 'test' | '',
    request: MethodRequest,
    response: MainResponse,
}
