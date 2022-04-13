import ModelBody from "@model/invoker/Body";

export default interface ModelFail {
    body: ModelBody;
    header: any;
    status: string;
}