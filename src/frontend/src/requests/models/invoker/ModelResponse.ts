import ModelFail from "./ModelFail";
import ModelSuccess from "./ModelSuccess";

export default interface ModelResponse{
    name: string;
    fail: ModelFail;
    success: ModelSuccess;
}