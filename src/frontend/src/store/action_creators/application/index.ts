import ApplicationCreators from "@action/application/ApplicationCreators";
import AuthCreators from "@action/application/AuthCreators";
import UpdateAssistantCreators from "@action/application/UpdateAssistantCreators";

export default {
    ...ApplicationCreators,
    ...AuthCreators,
    ...UpdateAssistantCreators,
}