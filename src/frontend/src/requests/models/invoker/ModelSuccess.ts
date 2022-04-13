import ModelBody from "@model/invoker/Body";

export default interface ModelSuccess {
    body: ModelBody;
    header: any;
    status: string;
}