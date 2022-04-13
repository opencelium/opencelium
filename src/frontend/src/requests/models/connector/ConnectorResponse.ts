import ModelConnector from "./Connector";
import ModelInvoker from "@model/invoker/Invoker";

export default interface ModelConnectorResponse extends ModelConnector{
    invoker: ModelInvoker,
}