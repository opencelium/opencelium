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

import * as AppActions from '@actions/app';
import * as AuthActions from '@actions/auth';
import * as DashboardActions from '@actions/dashboard';
import * as ConnectionsActions from '@actions/connections';
import * as ConnectionOverview2Actions from '@actions/connection_overview_2';
import * as InvokersActions from '@actions/invokers';
import * as UpdateAssistantActions from '@actions/update_assistant';
import * as AdminCardsActions from '@actions/admin_cards';
import * as ComponentsActions from '@actions/components';
import * as AppsActions from '@actions/apps';
import * as ConnectorsActions from '@actions/connectors';
import * as NotificationTemplatesActions from '@actions/notification_templates';
import * as SchedulesActions from '@actions/schedules';
import * as TemplatesActions from '@actions/templates';
import * as UserGroupsActions from '@actions/usergroups';
import * as UsersActions from '@actions/users';
import * as WebhooksActions from '@actions/webhooks';

export function getAllActions(){
    return {
        ...AppActions,
        ...AuthActions,
        ...DashboardActions.default,
        ...ConnectionsActions.default,
        ...ConnectionOverview2Actions.default,
        ...InvokersActions.default,
        ...UpdateAssistantActions.default,
        ...AdminCardsActions.default,
        ...ComponentsActions.default,
        ...AppsActions.default,
        ...ConnectorsActions.default,
        ...NotificationTemplatesActions.default,
        ...SchedulesActions.default,
        ...TemplatesActions.default,
        ...UserGroupsActions.default,
        ...UsersActions.default,
        ...WebhooksActions.default,
    }
}