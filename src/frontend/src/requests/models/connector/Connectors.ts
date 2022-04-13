import ModelConnector from "./Connector";
import ModelInvoker from "@model/invoker/Invoker";

export default interface ModelConnectors extends ModelConnector{
    invoker: ModelInvoker,
}