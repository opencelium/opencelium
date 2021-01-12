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

/**
 * constant values for input components
 */
const TITLE = {name: 'title', type: 'text', maxLength: 256, icon: 'text_fields'};
const DESCRIPTION = {name: 'description', type: 'textarea', maxLength: 1024, icon: 'short_text'};
const COMPONENT = {type: 'component', icon: 'short_text'};
const ICOMMON = {
    TITLE,
    DESCRIPTION,
    COMPONENT,
};

//CONNECTION
const CONNECTION_TITLE = {name: 'connection_title', type: 'connection_title', maxLength: 256, icon: 'text_fields'};
const CONNECTOR = {name: 'connectors', type: 'connectors', icon: 'device_hub'};
const CONNECTOR_READONLY = {name: 'connectors_readonly', type: 'connectors', icon: 'device_hub'};
const MODE = {name: 'mode', type: 'connection_mode'};
const METHODS = {name: 'methods', type: 'methods', icon: 'device_hub'};
const ICONNECTION = {
    CONNECTION_TITLE,
    CONNECTOR,
    CONNECTOR_READONLY,
    MODE,
    METHODS,
};

//CONNECTOR
const INVOKER = {name: 'invoker', type: 'select+description', icon: 'web_asset'};
const ICONNECTOR = {
    INVOKER,
};

//USER GROUP
const ROLE = {name: 'role', type: 'text', maxLength: 256, icon: 'perm_identity'};
const ICON = {name: 'icon', type: 'file', icon: 'photo'};
const COMPONENTS = {name: 'components', type: 'multiselect', icon: 'view_carousel'};
const PERMISSIONS = {name: 'permissions',type: 'permission_table', icon: 'pan_tool'};
const IUSER_GROUP = {
    ROLE,
    ICON,
    COMPONENTS,
    PERMISSIONS,
};

//USER
const EMAIL = {name: 'email', type: 'email', icon: 'email'};
const PASSWORD = {name: 'password', type: 'password', icon: 'vpn_key'};
const REPEAT_PASSWORD = {name: 'repeatPassword', type: 'password', icon: 'vpn_key'};
const NAME = {name: 'name', type: 'text', icon: 'perm_identity'};
const SURNAME = {name: 'surname', type: 'text', icon: 'perm_identity'};
const PHONE_NUMBER = {name: 'phoneNumber', type: 'text', icon: 'phone'};
const ORGANIZATION = {name: 'organisation', type: 'text', icon: 'domain'};
const DEPARTMENT = {name: 'department', type: 'text', icon: 'group'};
const USER_TITLE = {name: 'userTitle', type: 'user_title', icon: 'sentiment_very_satisfied'};
const PROFILE_PICTURE = {name: 'profilePicture', type: 'file', icon: 'photo'};
const USER_GROUP = {name: 'userGroup', type: 'select+description', icon: 'supervised_user_circle'};

const IUSER = {
    EMAIL,
    PASSWORD,
    REPEAT_PASSWORD,
    NAME,
    SURNAME,
    PHONE_NUMBER,
    ORGANIZATION,
    DEPARTMENT,
    USER_TITLE,
    PROFILE_PICTURE,
    USER_GROUP,
};

//INVOKER
const INVOKER_NAME = {name: 'name', type: 'invoker_name', maxLength: 256, icon: 'text_fields'};
const INVOKER_DESCRIPTION = {name: 'description', type: 'invoker_description', maxLength: 1024, icon: 'short_text'};
const INVOKER_HINT = {name: 'hint', type: 'invoker_hint', icon: 'label'};
const INVOKER_ICON = {name: 'icon', type: 'invoker_icon', icon: 'photo'};
const INVOKER_AUTHENTICATION = {name: 'auth', type: 'invoker_authentication', icon: 'https'};
const INVOKER_CONNECTION = {name: 'connection', type: 'invoker_connection', icon: 'perm_identity'};
const INVOKER_OPERATIONS = {name: 'operations', type: 'invoker_operations', icon: 'import_export'};

const IINVOKER = {
    INVOKER_NAME,
    INVOKER_DESCRIPTION,
    INVOKER_HINT,
    INVOKER_ICON,
    INVOKER_AUTHENTICATION,
    INVOKER_CONNECTION,
    INVOKER_OPERATIONS,
};

//NOTIFICATION TEMPLATE
const NOTIFICATION_TEMPLATE_NAME = {name: 'name', type: 'notification_template_name', maxLength: 256, icon: 'text_fields'};
const NOTIFICATION_TEMPLATE_TYPE = {name: 'type', type: 'notification_template_type', maxLength: 256, icon: 'mail'};
const NOTIFICATION_TEMPLATE_CONTENT = {name: 'content', type: 'notification_template_content',};

const INOTIFICATION_TEMPLATE = {
    NOTIFICATION_TEMPLATE_NAME,
    NOTIFICATION_TEMPLATE_TYPE,
    NOTIFICATION_TEMPLATE_CONTENT,
};

export const INPUTS = {
    ...ICOMMON,
    ...ICONNECTION,
    ...ICONNECTOR,
    ...IUSER_GROUP,
    ...IUSER,
    ...IINVOKER,
    ...INOTIFICATION_TEMPLATE,
};