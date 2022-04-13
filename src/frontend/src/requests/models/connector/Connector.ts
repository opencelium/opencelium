import ModelConnectorParent from "./ConnectorParent";

export default interface ModelConnector extends Partial<ModelConnectorParent>{
    invoker: {
        name: string;
    },
}