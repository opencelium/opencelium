import {addUser, updateUser, uploadUserImage, deleteUserById, deleteUsersById, getUserById, getAllUsers, checkUserEmail, deleteUserImage} from "@action/UserCreators";
import {addUserGroup, updateUserGroup, uploadUserGroupImage, deleteUserGroupById, deleteUserGroupsById, getUserGroupById, getAllUserGroups, checkUserGroupName, deleteUserGroupImage} from "@action/UserGroupCreators";
import {addConnector, deleteConnectorById, updateConnector, testRequestData, uploadConnectorImage, deleteConnectorsById, getConnectorById, getAllConnectors, checkConnectorTitle, deleteConnectorImage} from "@action/ConnectorCreators";
import {addConnection, updateConnection, deleteConnectionById, deleteConnectionsById, getConnectionById, getAllMetaConnections, getAllConnections, checkConnectionTitle} from "@action/connection/ConnectionCreators";
import {addSchedule, disableSchedules, enableSchedules, switchScheduleStatus, startSchedule, deleteScheduleById, updateSchedule, startSchedules, deleteSchedulesById, getCurrentSchedules, getSchedulesById, checkScheduleTitle, getScheduleById, getAllSchedules} from "@action/schedule/ScheduleCreators";
import {deleteTemplateById, updateTemplate, importTemplate, exportTemplate, updateTemplates, deleteTemplatesById, addTemplate, getAllTemplates, getTemplateById} from "@action/connection/TemplateCreators";
import {deleteWebhook, getWebhook} from "@action/schedule/WebhookCreators";
import {importInvoker, addInvoker, updateInvoker, uploadInvokerImage, deleteInvokerByName, deleteInvokersById, getAllInvokers, checkInvokerName, deleteInvokerImage, getInvokerByName, updateOperation} from "@action/InvokerCreators";
import {updateAuthUserDetail, login} from "@action/application/AuthCreators";
import {graphQLLogin} from "@action/graphql/GraphQLCreators";
import {getResources, getVersion, updateResources, getGlobalSearchData, getAllComponents, addTicket, openExternalUrl} from "@action/application/ApplicationCreators";
import {
  deleteApplicationFile,
  uploadApplicationFile,
  updateApplication,
  getOnlineUpdates,
  checkApplicationBeforeUpdate,
  getOfflineUpdates,
  checkForUpdates
} from "@action/application/UpdateAssistantCreators";
import {checkNeo4j, checkElasticsearch, checkAllExternalApplications} from "@action/external_application/ExternalApplicationCreators";
import {addNotificationTemplate, updateNotificationTemplate, deleteNotificationTemplateById, deleteNotificationTemplatesById, getNotificationTemplateById, getNotificationTemplatesByType, checkNotificationTemplateName, getAllNotificationTemplates} from "@action/schedule/NotificationTemplateCreators";
import { copyWebhookToClipboard } from "@store/reducers/schedule/ScheduleSlice";
/*
* TODO: copy to clipboard webhook, user email already exists,
*  user group name already exists, connector title already exists,
*  invoker name already exists, connection name already exists,
*  schedule name already exists, notification template already exists
*  finish translations for rejected cases
*/

/*
* TODO: import actions as one constant
*/

const NotificationTranslations = {
  fulfilled: {
    [copyWebhookToClipboard.type]: "The webhook was successfully copied",
    [addUser.fulfilled.type]: "The user <1><0>{{email}}</0></1> was successfully added.",
    [updateUser.fulfilled.type]: "The user <1><0>{{email}}</0></1> was successfully updated.",
    [uploadUserImage.fulfilled.type]: "The image of the user <1><0>{{email}}</0></1> was successfully uploaded.",
    [deleteUserById.fulfilled.type]: "The user <1><0>{{email}}</0></1> was successfully removed.",
    [deleteUsersById.fulfilled.type]: "The selected users were successfully removed.",
    [addUserGroup.fulfilled.type]: "The user group <1><0>{{name}}</0></1> was successfully added.",
    [updateUserGroup.fulfilled.type]: "The user group <1><0>{{name}}</0></1> was successfully updated.",
    [uploadUserGroupImage.fulfilled.type]: "The image of the user group <1><0>{{name}}</0></1> was successfully uploaded.",
    [deleteUserGroupById.fulfilled.type]: "The user group <1><0>{{name}}</0></1> was successfully removed.",
    [deleteUserGroupsById.fulfilled.type]: "The selected user groups were successfully removed.",
    [testRequestData.fulfilled.type]: "Successfully tested!",
    [addConnector.fulfilled.type]: "The connector <1><0>{{title}}</0></1> was successfully added",
    [updateConnector.fulfilled.type]: "The connector <1><0>{{title}}</0></1> was successfully updated",
    [uploadConnectorImage.fulfilled.type]: "The image of the connector <1><0>{{title}}</0></1> was successfully uploaded.",
    [deleteConnectorById.fulfilled.type]: "The connector <1><0>{{title}}</0></1> was successfully removed",
    [deleteConnectorsById.fulfilled.type]: "The selected connectors were successfully removed",
    [addConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully added",
    [updateConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully updated",
    [deleteConnectionById.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully removed",
    [deleteConnectionsById.fulfilled.type]: "The selected connections were successfully removed",
    [startSchedule.fulfilled.type]: "The job <1><0>{{title}}</0></1> was successfully triggered",
    [addSchedule.fulfilled.type]: "The schedule <1><0>{{title}}</0></1> was successfully added",
    [deleteScheduleById.fulfilled.type]: "The schedule <1><0>{{title}}</0></1> was successfully removed",
    [updateSchedule.fulfilled.type]: "The schedule <1><0>{{title}}</0></1> was successfully updated",
    [switchScheduleStatus.fulfilled.type]: "The status of the job <1><0>{{title}}</0></1> was successfully updated",
    [enableSchedules.fulfilled.type]: "The selected schedules were successfully enabled",
    [disableSchedules.fulfilled.type]: "The selected schedules were successfully disabled",
    [startSchedules.fulfilled.type]: "The selected schedules were successfully started",
    [deleteSchedulesById.fulfilled.type]: "The selected schedules were successfully removed",
    [addTemplate.fulfilled.type]: "The template <1><0>{{name}}</0></1> of the <3><0>{{title}}</0></3> was successfully added",
    [updateTemplate.fulfilled.type]: "The template <1><0>{{name}}</0></1> was successfully updated",
    [updateTemplates.fulfilled.type]: "The templates were successfully updated",
    [importTemplate.fulfilled.type]: "The Template <1><0>{{name}}</0></1> was successfully imported",
    [exportTemplate.fulfilled.type]: "The Template <1><0>{{name}}</0></1> was successfully downloaded",
    [deleteTemplateById.fulfilled.type]: "The template <1><0>{{name}}</0></1> was successfully removed",
    [deleteTemplatesById.fulfilled.type]: "The selected templates were successfully removed",
    [getWebhook.fulfilled.type]: "The webhook of the job <1><0>{{name}}</0></1> was successfully created",
    [deleteWebhook.fulfilled.type]: "The webhook of the job <1><0>{{name}}</0></1> was successfully removed",
    [addInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully added.",
    [importInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully imported.",
    [deleteInvokerByName.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully removed",
    [deleteInvokersById.fulfilled.type]: "The selected invokers were successfully removed",
    [updateInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully updated",
    [uploadInvokerImage.fulfilled.type]: "The image of the invoker <1><0>{{name}}</0></1> was successfully uploaded.",
    [addNotificationTemplate.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully added",
    [updateNotificationTemplate.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully updated",
    [deleteNotificationTemplateById.fulfilled.type]: "The notification <1><0>{{name}}</0></1> was successfully removed",
    [deleteNotificationTemplatesById.fulfilled.type]: "The selected templates were successfully removed",
    [checkForUpdates.fulfilled.type]: "OC Update <1><0>{{version}}</0></1> available",
    [getResources.fulfilled.type]: "New invokers and templates are available (<1><0>{{updates}}</0></1>)",
    [uploadApplicationFile.fulfilled.type]: "New version was successfully uploaded",
    [deleteApplicationFile.fulfilled.type]: "The version was successfully removed",
    [updateResources.fulfilled.type]: "",
    [updateApplication.fulfilled.type]: "Opencelium was successfully updated",
    [updateAuthUserDetail.fulfilled.type]: "The settings were successfully updated",
  },
  rejected: {
    [updateOperation.rejected.type]: {
      "__DEFAULT__": "The invoker operation was not updated"
    },
    [graphQLLogin.rejected.type]: "GraphQL was not connected",
    [login.rejected.type]: {
      "__DEFAULT__": "There is an error during the login",
      "UNAUTHORIZED": "Wrong email or password",
      "WRONG_CREDENTIALS": "Wrong email or password",
      "NETWORK_ERROR": "The server connection problem.",
    },
    [checkNeo4j.rejected.type]: {
      "DOWN": "Neo4j is down",
      "__DEFAULT__": "Neo4j could not be checked"
    },
    [checkElasticsearch.rejected.type]: {
      "DOWN": "Elasticsearch is down",
      "__DEFAULT__": "Neo4j could not be checked"
    },
    [getUserById.rejected.type]: "There is an error fetching user.",
    [getAllUsers.rejected.type]: "There is an error fetching users.",
    [checkUserEmail.rejected.type]: "There is an error checking email uniqueness.",
    [deleteUserImage.rejected.type]: "There is an error removing user's image.",
    [addUser.rejected.type]: "The user <1><0>{{email}}</0></1> was not added.",
    [updateUser.rejected.type]: "The user <1><0>{{email}}</0></1> was not updated.",
    [uploadUserImage.rejected.type]: "The image of the user <1><0>{{email}}</0></1> was not uploaded.",
    [deleteUserById.rejected.type]: "The user <1><0>{{email}}</0></1> was not removed.",
    [deleteUsersById.rejected.type]: "The selected users were not removed.",
    [getUserGroupById.rejected.type]: "There is an error fetching user group.",
    [getAllUserGroups.rejected.type]: "There is an error fetching user groups.",
    [addUserGroup.rejected.type]: "The user group <1><0>{{name}}</0></1> was not added.",
    [updateUserGroup.rejected.type]: "The user group <1><0>{{name}}</0></1> was not updated.",
    [uploadUserGroupImage.rejected.type]: "The image of the user group <1><0>{{name}}</0></1> was not uploaded.",
    [deleteUserGroupById.rejected.type]: "The user group <1><0>{{name}}</0></1> was not removed.",
    [deleteUserGroupsById.rejected.type]: "The selected user groups were not removed.",
    [testRequestData.rejected.type]: {
      "COMMUNICATION_FAILED": "Connection was failed",
      "__DEFAULT__": "Unsuccessfully tested"
    },
    [getConnectorById.rejected.type]: "There is an error fetching connector.",
    [getAllConnectors.rejected.type]: {
      "__DEFAULT__": "There is an error fetching connectors."
    },
    [addConnector.rejected.type]: "The connector <1><0>{{title}}</0></1> was not added",
    [updateConnector.rejected.type]: "The connector <1><0>{{title}}</0></1> was not updated",
    [uploadConnectorImage.rejected.type]: "The image of the connector <1><0>{{title}}</0></1> was not uploaded.",
    [deleteConnectorById.rejected.type]: "The connector <1><0>{{title}}</0></1> was not removed",
    [deleteConnectorsById.rejected.type]: "The selected connectors were not removed",
    [getConnectionById.rejected.type]: "There is an error fetching connection.",
    [getAllConnections.rejected.type]: "There is an error fetching connections.",
    [addConnection.rejected.type]: "The connection <1><0>{{title}}</0></1> was not added",
    [updateConnection.rejected.type]: "The connection <1><0>{{title}}</0></1> was not updated",
    [deleteConnectionById.rejected.type]: "The connection <1><0>{{title}}</0></1> was not removed",
    [deleteConnectionsById.rejected.type]: "The selected connections were not removed",
    [getScheduleById.rejected.type]: "There is an error fetching schedule.",
    [getSchedulesById.rejected.type]: "There is an error fetching schedules.",
    [startSchedule.rejected.type]: "The job <1><0>{{title}}</0></1> was not triggered",
    [addSchedule.rejected.type]: "The schedule <1><0>{{title}}</0></1> was not added",
    [deleteScheduleById.rejected.type]: "The schedule <1><0>{{title}}</0></1> was not removed",
    [updateSchedule.rejected.type]: "The schedule <1><0>{{title}}</0></1> was not updated",
    [switchScheduleStatus.rejected.type]: "The status of the job <1><0>{{title}}</0></1> was not updated",
    [enableSchedules.rejected.type]: "The selected schedules were not enabled",
    [disableSchedules.rejected.type]: "The selected schedules were not disabled",
    [startSchedules.rejected.type]: "The selected schedules were not started",
    [deleteSchedulesById.rejected.type]: "The selected schedules were not removed",
    [getTemplateById.rejected.type]: "There is an error fetching template.",
    [getAllTemplates.rejected.type]: "There is an error fetching templates.",
    [addTemplate.rejected.type]: "The template <1><0>{{name}}</0></1> of the <3><0>{{title}}</0></3> was not added",
    [updateTemplate.rejected.type]: "The template <1><0>{{name}}</0></1> was not updated",
    [updateTemplates.rejected.type]: "The templates were not updated",
    [importTemplate.rejected.type]: "The Template <1><0>{{name}}</0></1> was not imported",
    [exportTemplate.rejected.type]: "The Template <1><0>{{name}}</0></1> was not downloaded",
    [deleteTemplateById.rejected.type]: "The template <1><0>{{name}}</0></1> was not removed",
    [deleteTemplatesById.rejected.type]: "The selected templates were not removed",
    [getWebhook.rejected.type]: "The webhook of the job <1><0>{{name}}</0></1> was not created",
    [deleteWebhook.rejected.type]: "The webhook of the job <1><0>{{name}}</0></1> was not removed",
    [getInvokerByName.rejected.type]: "There is an error fetching invoker.",
    [getAllInvokers.rejected.type]: "There is an error fetching invokers.",
    [addInvoker.rejected.type]: "The invoker <1><0>{{name}}</0></1> was not added.",
    [importInvoker.rejected.type]: "The invoker was not imported.",
    [deleteInvokerByName.rejected.type]: "The invoker <1><0>{{name}}</0></1> was not removed",
    [deleteInvokersById.rejected.type]: "The selected invokers were not removed",
    [updateInvoker.rejected.type]: "The invoker <1><0>{{name}}</0></1> was not updated",
    [uploadInvokerImage.rejected.type]: "The image of the invoker <1><0>{{name}}</0></1> was not uploaded.",
    [getNotificationTemplateById.rejected.type]: "There is an error fetching notification template.",
    [getAllNotificationTemplates.rejected.type]: "There is an error fetching notification templates.",
    [addNotificationTemplate.rejected.type]: "The notification <1><0>{{name}}</0></1> was not added",
    [updateNotificationTemplate.rejected.type]: "The notification <1><0>{{name}}</0></1> was not updated",
    [deleteNotificationTemplateById.rejected.type]: "The notification <1><0>{{name}}</0></1> was not removed",
    [deleteNotificationTemplatesById.rejected.type]: "The selected templates were not removed",
    [checkForUpdates.rejected.type]: "OC Update <1><0>{{version}}</0></1> available",
    [getResources.rejected.type]: "New invokers and templates are available (<1><0>{{update}}</0></1>)",
    [uploadApplicationFile.rejected.type]: "New version was not uploaded",
    [deleteApplicationFile.rejected.type]: "The version was not removed",
    [updateResources.rejected.type]: "",
    [updateApplication.rejected.type]: "Opencelium was not updated",
    [updateAuthUserDetail.rejected.type]: "The settings were not updated",
  }
}

export {
  NotificationTranslations,
}