/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {
    combineEpics,
} from 'redux-observable';
import {
    fetchUserEpic, fetchUsersEpic, addUserEpic, addProfilePictureEpic,
    updateUserEpic, updateProfilePictureEpic, updateUserDetailEpic, deleteUserEpic,
    checkUserEmailEpic, deleteUsersEpic,
} from '@epics/users';
import {
    addUserGroupEpic, addGroupIconEpic, deleteUserGroupEpic, fetchUserGroupEpic,
    fetchUserGroupsEpic, updateUserGroupEpic, updateGroupIconEpic, checkUserGroupNameEpic,
    deleteUserGroupIconEpic, deleteUserGroupsEpic,
} from '@epics/usergroups';
import {
    loginUserEpic, logoutUserEpic, updateAuthUserLanguageEpic, updateDashboardSettingsEpic,
    updateThemeEpic, toggleAppTourEpic,
} from '@epics/auth';
import {
    fetchComponentsEpic,
} from '@epics/components';
import {
    fetchConnectorEpic, fetchConnectorsEpic, addConnectorEpic, addConnectorIconEpic,
    updateConnectorEpic, updateConnectorIconEpic, deleteConnectorEpic, testConnectorEpic,
    checkConnectorTitleEpic, deleteConnectorsEpic,
} from '@epics/connectors';
import {
    fetchInvokersEpic, fetchInvokerEpic, addInvokerEpic,
    updateInvokerEpic, deleteInvokerEpic, fetchDefaultInvokersEpic, deleteInvokersEpic,
} from '@epics/invokers';
import {
    fetchConnectionEpic, fetchConnectionsEpic, addConnectionEpic,
    updateConnectionEpic, deleteConnectionEpic, deleteConnectionsEpic, checkConnectionTitleEpic,
    validateConnectionFormMethodsEpic, checkNeo4jEpic, checkNeo4jFulfilledEpic,
    sendOperationRequestEpic, checkConnectionEpic, fetchMetaConnectionsEpic,
} from '@epics/connections';
import {
    deleteTemplateEpic, addTemplateEpic, fetchTemplatesEpic, fetchTemplateEpic,
    importTemplateEpic, exportTemplateEpic, convertTemplateEpic,
    convertTemplatesEpic, deleteTemplatesEpic, duplicateTemplateEpic, updateTemplateEpic,
} from '@epics/templates';
import {
    fetchScheduleEpic, fetchSchedulesEpic, addScheduleEpic,
    updateScheduleEpic, deleteScheduleEpic, deleteSchedulesEpic,
    startSchedulesEpic, enableSchedulesEpic, disableSchedulesEpic,
    updateScheduleStatusEpic, triggerScheduleEpic, triggerScheduleSuccessEpic,
    fetchCurrentSchedulesEpic, fetchSchedulesByIdsEpic,
    fetchScheduleNotificationEpic, fetchScheduleNotificationsEpic,
    addScheduleNotificationEpic, updateScheduleNotificationEpic, deleteScheduleNotificationEpic,
    fetchScheduleNotificationTemplatesEpic, fetchNotificationRecipientsEpic, fetchSlackChannelsEpic,
} from '@epics/schedules';
import {
    addWebHookEpic, updateWebHookEpic, deleteWebHookEpic,
} from '@epics/webhooks';
import {
    fetchAppsEpic, checkAppEpic
} from "@epics/apps";
import {
    fetchAdminCardsEpic, loadAdminCardsLinkEpic,
} from "@epics/admin_cards";
import {
    addErrorTicketEpic, fetchAppVersionEpic, fetchDataForSearchEpic,
} from "@epics/app";
import {
    fetchNotificationTemplatesEpic, fetchNotificationTemplateEpic, addNotificationTemplateEpic,
    updateNotificationTemplateEpic, deleteNotificationTemplateEpic, deleteNotificationTemplatesEpic,
} from '@epics/notification_templates';
import {
    fetchUpdateAppVersionEpic, fetchOfflineUpdatesEpic, fetchOnlineUpdatesEpic, deleteVersionEpic,
    uploadVersionEpic, updateTemplatesForAssistantEpic, updateInvokersForAssistantEpic, fetchSystemRequirementsEpic,
    addConvertTemplatesLogsEpic, addConvertInvokersLogsEpic, updateConnectionsForAssistantEpic, updateSystemForAssistantEpic,
    checkResetFilesEpic,
} from "@epics/update_assistant";
import {
    fetchWidgetsEpic, fetchWidgetSettingsEpic, updateWidgetSettingsEpic,
} from "@epics/dashboard";
import {fetchSubscriptionUpdateEpic, doSubscriptionUpdateEpic} from "@epics/subscription_update";


/**
 * combine epics for store
 */
export default combineEpics(
    loginUserEpic,
    logoutUserEpic,
    updateAuthUserLanguageEpic,
    updateDashboardSettingsEpic,
    updateThemeEpic,
    fetchUserEpic,
    fetchUsersEpic,
    addUserEpic,
    addProfilePictureEpic,
    updateUserEpic,
    deleteUserEpic,
    deleteUsersEpic,
    updateUserDetailEpic,
    addUserGroupEpic,
    addGroupIconEpic,
    checkUserGroupNameEpic,
    deleteUserGroupIconEpic,
    updateProfilePictureEpic,
    deleteUserGroupEpic,
    deleteUserGroupsEpic,
    fetchUserGroupEpic,
    fetchUserGroupsEpic,
    updateUserGroupEpic,
    updateGroupIconEpic,
    fetchComponentsEpic,
    fetchConnectorsEpic,
    fetchConnectorEpic,
    addConnectorEpic,
    addConnectorIconEpic,
    updateConnectorEpic,
    updateConnectorIconEpic,
    deleteConnectorEpic,
    deleteConnectorsEpic,
    fetchInvokersEpic,
    fetchInvokerEpic,
    addInvokerEpic,
    updateInvokerEpic,
    deleteInvokerEpic,
    deleteInvokersEpic,
    fetchDefaultInvokersEpic,
    testConnectorEpic,
    checkConnectorTitleEpic,
    fetchConnectionEpic,
    fetchMetaConnectionsEpic,
    fetchConnectionsEpic,
    checkConnectionTitleEpic,
    validateConnectionFormMethodsEpic,
    checkNeo4jEpic,
    checkNeo4jFulfilledEpic,
    sendOperationRequestEpic,
    addConnectionEpic,
    updateConnectionEpic,
    deleteConnectionEpic,
    deleteConnectionsEpic,
    fetchScheduleEpic,
    fetchSchedulesEpic,
    fetchCurrentSchedulesEpic,
    fetchSchedulesByIdsEpic,
    fetchScheduleNotificationEpic,
    fetchScheduleNotificationsEpic,
    fetchScheduleNotificationTemplatesEpic,
    fetchNotificationRecipientsEpic,
    fetchSlackChannelsEpic,
    addScheduleNotificationEpic,
    updateScheduleNotificationEpic,
    deleteScheduleNotificationEpic,
    addScheduleEpic,
    updateScheduleEpic,
    deleteScheduleEpic,
    startSchedulesEpic,
    enableSchedulesEpic,
    disableSchedulesEpic,
    deleteSchedulesEpic,
    updateScheduleStatusEpic,
    triggerScheduleEpic,
    triggerScheduleSuccessEpic,
    deleteTemplateEpic,
    deleteTemplatesEpic,
    fetchTemplatesEpic,
    fetchTemplateEpic,
    addTemplateEpic,
    duplicateTemplateEpic,
    updateTemplateEpic,
    convertTemplateEpic,
    convertTemplatesEpic,
    importTemplateEpic,
    exportTemplateEpic,
    fetchAppsEpic,
    checkAppEpic,
    addWebHookEpic,
    updateWebHookEpic,
    deleteWebHookEpic,
    checkUserEmailEpic,
    toggleAppTourEpic,
    fetchAdminCardsEpic,
    loadAdminCardsLinkEpic,
    addErrorTicketEpic,
    fetchAppVersionEpic,
    fetchDataForSearchEpic,
    fetchNotificationTemplatesEpic,
    fetchNotificationTemplateEpic,
    addNotificationTemplateEpic,
    updateNotificationTemplateEpic,
    deleteNotificationTemplateEpic,
    deleteNotificationTemplatesEpic,
    checkConnectionEpic,
    fetchUpdateAppVersionEpic,
    fetchSubscriptionUpdateEpic,
    doSubscriptionUpdateEpic,
    fetchOfflineUpdatesEpic,
    fetchOnlineUpdatesEpic,
    deleteVersionEpic,
    uploadVersionEpic,
    updateTemplatesForAssistantEpic,
    updateInvokersForAssistantEpic,
    fetchSystemRequirementsEpic,
    addConvertTemplatesLogsEpic,
    addConvertInvokersLogsEpic,
    updateConnectionsForAssistantEpic,
    updateSystemForAssistantEpic,
    fetchWidgetSettingsEpic,
    fetchWidgetsEpic,
    updateWidgetSettingsEpic,
    checkResetFilesEpic,
);