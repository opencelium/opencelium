import ModelConnector from "./ConnectorParent";

export default interface ModelConnectorPoust extends Partial<ModelConnector>{
    invoker: {
        name: string;
    },
}