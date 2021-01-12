/*
 * Copyright (C) <2020>  <becon GmbH>
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
    checkUserEmailEpic,
} from '@epics/users';
import {
    addUserGroupEpic, addGroupIconEpic, deleteUserGroupEpic, fetchUserGroupEpic,
    fetchUserGroupsEpic, updateUserGroupEpic, updateGroupIconEpic, checkUserGroupNameEpic,
    deleteUserGroupIconEpic,
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
} from '@epics/connectors';
import {
    fetchInvokersEpic, fetchInvokerEpic, addInvokerEpic,
    updateInvokerEpic, deleteInvokerEpic,
} from '@epics/invokers';
import {
    fetchConnectionEpic, fetchConnectionsEpic, addConnectionEpic,
    updateConnectionEpic, deleteConnectionEpic, checkConnectionTitleEpic,
    validateConnectionFormMethodsEpic, checkNeo4jEpic, checkNeo4jFulfilledEpic,
    sendOperationRequestEpic, checkConnectionEpic,
} from '@epics/connections';
import {
    deleteTemplateEpic, addTemplateEpic, fetchTemplatesEpic,
    importTemplateEpic, exportTemplateEpic, convertTemplateEpic,
    convertTemplatesEpic
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
    addErrorTicketEpic, fetchAppVersionEpic,
} from "@epics/app";
import {
    fetchNotificationTemplatesEpic, fetchNotificationTemplateEpic, addNotificationTemplateEpic,
    updateNotificationTemplateEpic, deleteNotificationTemplateEpic,
} from '@epics/notification_templates';
import {
    fetchUpdateAppVersionEpic, fetchOfflineUpdatesEpic, fetchOnlineUpdatesEpic,
} from "@epics/update_assistant";


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
    updateUserDetailEpic,
    addUserGroupEpic,
    addGroupIconEpic,
    checkUserGroupNameEpic,
    deleteUserGroupIconEpic,
    updateProfilePictureEpic,
    deleteUserGroupEpic,
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
    fetchInvokersEpic,
    fetchInvokerEpic,
    addInvokerEpic,
    updateInvokerEpic,
    deleteInvokerEpic,
    testConnectorEpic,
    fetchConnectionEpic,
    fetchConnectionsEpic,
    checkConnectionTitleEpic,
    validateConnectionFormMethodsEpic,
    checkNeo4jEpic,
    checkNeo4jFulfilledEpic,
    sendOperationRequestEpic,
    addConnectionEpic,
    updateConnectionEpic,
    deleteConnectionEpic,
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
    fetchTemplatesEpic,
    addTemplateEpic,
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
    fetchNotificationTemplatesEpic,
    fetchNotificationTemplateEpic,
    addNotificationTemplateEpic,
    updateNotificationTemplateEpic,
    deleteNotificationTemplateEpic,
    checkConnectionEpic,
    fetchUpdateAppVersionEpic,
    fetchOfflineUpdatesEpic,
    fetchOnlineUpdatesEpic,
);