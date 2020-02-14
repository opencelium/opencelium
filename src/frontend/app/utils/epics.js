/*
 * Copyright (C) <2019>  <becon GmbH>
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
} from '../epics/users';
import {
    addUserGroupEpic, addGroupIconEpic, deleteUserGroupEpic, fetchUserGroupEpic,
    fetchUserGroupsEpic, updateUserGroupEpic, updateGroupIconEpic,
} from '../epics/usergroups';
import {
    loginUserEpic, logoutUserEpic, updateAuthUserLanguageEpic, updateDashboardSettingsEpic,
    updateThemeEpic, toggleAppTourEpic,
} from '../epics/auth';
import {
    fetchComponentsEpic,
} from '../epics/components';
import {
    fetchConnectorEpic, fetchConnectorsEpic, addConnectorEpic,
    updateConnectorEpic, deleteConnectorEpic, testConnectorEpic,
} from '../epics/connectors';
import {
    fetchInvokersEpic, addInvokerEpic, updateInvokerEpic, deleteInvokerEpic,
} from '../epics/invokers';
import {
    fetchConnectionEpic, fetchConnectionsEpic, addConnectionEpic,
    updateConnectionEpic, deleteConnectionEpic, checkConnectionTitleEpic,
} from '../epics/connections';
import {
    deleteTemplateEpic, addTemplateEpic, fetchTemplatesEpic,
    importTemplateEpic, exportTemplateEpic,
} from '../epics/templates';
import {
    fetchScheduleEpic, fetchSchedulesEpic, addScheduleEpic,
    updateScheduleEpic, deleteScheduleEpic, deleteSchedulesEpic,
    startSchedulesEpic, enableSchedulesEpic, disableSchedulesEpic,
    updateScheduleStatusEpic, triggerScheduleEpic, triggerScheduleSuccessEpic,
    fetchCurrentSchedulesEpic, fetchSchedulesByIdsEpic,
} from '../epics/schedules';
import {
    addWebHookEpic, updateWebHookEpic, deleteWebHookEpic,
} from '../epics/webhooks';
import {
    fetchAppsEpic, loadAppsLinkEpic, checkAppEpic
} from "../epics/apps";
import {
    fetchAdminCardsEpic, loadAdminCardsLinkEpic,
} from "../epics/admin_cards";
import {
    addErrorTicketEpic,
} from "../epics/app";


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
    updateConnectorEpic,
    deleteConnectorEpic,
    fetchInvokersEpic,
    addInvokerEpic,
    updateInvokerEpic,
    deleteInvokerEpic,
    testConnectorEpic,
    fetchConnectionEpic,
    fetchConnectionsEpic,
    checkConnectionTitleEpic,
    addConnectionEpic,
    updateConnectionEpic,
    deleteConnectionEpic,
    fetchScheduleEpic,
    fetchSchedulesEpic,
    fetchCurrentSchedulesEpic,
    fetchSchedulesByIdsEpic,
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
    importTemplateEpic,
    exportTemplateEpic,
    fetchAppsEpic,
    checkAppEpic,
    addWebHookEpic,
    updateWebHookEpic,
    deleteWebHookEpic,
    checkUserEmailEpic,
    loadAppsLinkEpic,
    toggleAppTourEpic,
    fetchAdminCardsEpic,
    loadAdminCardsLinkEpic,
    addErrorTicketEpic,
);