/*
 * Copyright (C) <2022>  <becon GmbH>
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

export const NO_RESTRICTION = {
    entity: 'ALL',
    name: 'ALL'
}
export interface PermissionProps {
    entity: string,
    name: string,
}
export interface ComponentPermissionProps{
    CREATE?: PermissionProps,
    READ?: PermissionProps,
    UPDATE?: PermissionProps,
    DELETE?: PermissionProps,
}
/**
 * permission constants for user
 */
export const UserPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USER', name: 'CREATE'},
    READ: {entity: 'USER', name: 'READ'},
    UPDATE: {entity: 'USER', name: 'UPDATE'},
    DELETE: {entity: 'USER', name: 'DELETE'},
};

/**
 * permission constants for usergroup
 */
export const UserGroupPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USERGROUP', name: 'CREATE'},
    READ: {entity: 'USERGROUP', name: 'READ'},
    UPDATE: {entity: 'USERGROUP', name: 'UPDATE'},
    DELETE: {entity: 'USERGROUP', name: 'DELETE'},
};

/**
 * permission constants for connector
 */
export const ConnectorPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'CONNECTOR', name: 'CREATE'},
    READ: {entity: 'CONNECTOR', name: 'READ'},
    UPDATE: {entity: 'CONNECTOR', name: 'UPDATE'},
    DELETE: {entity: 'CONNECTOR', name: 'DELETE'},
};

/**
 * permission constants for my profile
 */
export const MyProfilePermissions: ComponentPermissionProps = {
    CREATE: {entity: 'MYPROFILE', name: 'CREATE'},
    READ: {entity: 'MYPROFILE', name: 'READ'},
    UPDATE: {entity: 'MYPROFILE', name: 'UPDATE'},
    DELETE: {entity: 'MYPROFILE', name: 'DELETE'},
};

/**
 * permission constants for connection
 */
export const ConnectionPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'CONNECTION', name: 'CREATE'},
    READ: {entity: 'CONNECTION', name: 'READ'},
    UPDATE: {entity: 'CONNECTION', name: 'UPDATE'},
    DELETE: {entity: 'CONNECTION', name: 'DELETE'},
};

/**
 * permission constants for schedule
 */
export const SchedulePermissions: ComponentPermissionProps = {
    CREATE: {entity: 'SCHEDULE', name: 'CREATE'},
    READ: {entity: 'SCHEDULE', name: 'READ'},
    UPDATE: {entity: 'SCHEDULE', name: 'UPDATE'},
    DELETE: {entity: 'SCHEDULE', name: 'DELETE'},
};

/**
 * (not used) permission constants for dashboard
 */
export const DashboardPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'DASHBOARD', name: 'CREATE'},
    READ: {entity: 'DASHBOARD', name: 'READ'},
    UPDATE: {entity: 'DASHBOARD', name: 'UPDATE'},
    DELETE: {entity: 'DASHBOARD', name: 'DELETE'},
};

/**
 * permission constants for app
 */
export const ExternalApplicationPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'APP', name: 'CREATE'},
    READ: {entity: 'APP', name: 'READ'},
    UPDATE: {entity: 'APP', name: 'UPDATE'},
    DELETE: {entity: 'APP', name: 'DELETE'},
};

/**
 * permission constants for invoker
 */
export const InvokerPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'INVOKER', name: 'CREATE'},
    READ: {entity: 'INVOKER', name: 'READ'},
    UPDATE: {entity: 'INVOKER', name: 'UPDATE'},
    DELETE: {entity: 'INVOKER', name: 'DELETE'},
};

/**
 * permission constants for admin cards
 */
export const AdminCardPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USER', name: 'CREATE'},
    READ: {entity: 'USER', name: 'READ'},
    UPDATE: {entity: 'USER', name: 'UPDATE'},
    DELETE: {entity: 'USER', name: 'DELETE'},
};

/**
 * permission constants for connector
 */
export const TemplatePermissions: ComponentPermissionProps = {
    CREATE: {entity: 'SCHEDULE', name: 'CREATE'},
    READ: {entity: 'SCHEDULE', name: 'READ'},
    UPDATE: {entity: 'SCHEDULE', name: 'UPDATE'},
    DELETE: {entity: 'SCHEDULE', name: 'DELETE'},
};

/**
 * permission constants for notification template
 */
export const NotificationTemplatePermissions: ComponentPermissionProps = {
    CREATE: {entity: 'SCHEDULE', name: 'CREATE'},
    READ: {entity: 'SCHEDULE', name: 'READ'},
    UPDATE: {entity: 'SCHEDULE', name: 'UPDATE'},
    DELETE: {entity: 'SCHEDULE', name: 'DELETE'},
};
/**
 * permission constants for update assistant
 */
/*
* TODO: change entity when backend will be ready
*/
export const UpdateAssistantPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USERGROUP', name: 'CREATE'},
    READ: {entity: 'USERGROUP', name: 'READ'},
    UPDATE: {entity: 'USERGROUP', name: 'UPDATE'},
    DELETE: {entity: 'USERGROUP', name: 'DELETE'},
}
/*
* TODO: change entity when backend will be ready
*/
export const UpdateSubscriptionPermissions: ComponentPermissionProps = {
    CREATE: {entity: 'USERGROUP', name: 'CREATE'},
    READ: {entity: 'USERGROUP', name: 'READ'},
    UPDATE: {entity: 'USERGROUP', name: 'UPDATE'},
    DELETE: {entity: 'USERGROUP', name: 'DELETE'},
};