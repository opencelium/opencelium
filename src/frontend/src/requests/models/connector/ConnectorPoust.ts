import ModelConnector from "./Connector";

export default interface ModelConnectorPoust extends ModelConnector{
    invoker: {
        name: string;
    },
}