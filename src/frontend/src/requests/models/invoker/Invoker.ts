import ModelOperation from "./Operation";

export default interface ModelInvoker{
    authType: string;
    description: string;
    hint: string;
    icon?: string;
    name: string;
    operations: ModelOperation[];
    requiredData: string[];
}