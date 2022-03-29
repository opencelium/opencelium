import Application from "@action/application";
import Connection from "@action/connection";
import Dashboard from "@action/dashboard";
import ExternalApplication from "@action/external_application";
import Schedule from "@action/schedule";
import ConnectorCreators from "@action/ConnectorCreators";
import InvokerCreators from "@action/InvokerCreators";
import UserCreators from "@action/UserCreators";
import UserGroupCreators from "@action/UserGroupCreators";

export default {
    ...Application,
    ...Connection,
    ...Dashboard,
    ...ExternalApplication,
    ...Schedule,
    ...ConnectorCreators,
    ...InvokerCreators,
    ...UserCreators,
    ...UserGroupCreators,
}