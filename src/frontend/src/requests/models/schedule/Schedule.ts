import { ModelWebhook } from "./Webhook";

export interface ModelSchedule{
    cronExp: string;
    debugMode: boolean;
    schedulerId?: number;
    status: number;
    title: string;
    connectionId: number;
    connection?: any;
    lastExecution?: any;
    notification?: any[];
    webhook?: ModelWebhook;
}