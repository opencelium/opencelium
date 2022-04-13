import ModelRequest from "./Request";
import ModelResponse from "./ModelResponse";

export default interface ModelOperation{
    name: string;
    request: ModelRequest;
    response: ModelResponse;
    type: "" | "test";
}