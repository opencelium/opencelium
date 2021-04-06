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