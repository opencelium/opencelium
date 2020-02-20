
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
 * app's actions for redux state
 */
export const AppAction = {
    CHANGE_LANGUAGE:                    'CHANGE_LANGUAGE',
    UPDATE_MENU:                        'UPDATE_MENU',
    DO_REQUEST:                         'DO_REQUEST',
    DO_REQUEST_REJECTED:                'DO_REQUEST_REJECTED',
    ADD_ERRORTICKET:                    'ADD_ERRORTICKET',
    ADD_ERRORTICKET_FULFILLED:          'ADD_ERRORTICKET_FULFILLED',
    ADD_ERRORTICKET_REJECTED:           'ADD_ERRORTICKET_REJECTED',
};

/**
 * auth's actions for redux state
 */
export const AuthAction = {
    INITIAL_STATE:                      'INITIAL_STATE',
    LOG_IN:                             'LOG_IN',
    LOG_IN_FULFILLED:                   'LOG_IN_FULFILLED',
    LOG_IN_REJECTED:                    'LOG_IN_REJECTED',
    LOG_IN_CANCELED:                    'LOG_IN_CANCELED',
    LOG_OUT:                            'LOG_OUT',
    LOG_OUT_FULFILLED:                  'LOG_OUT_FULFILLED',
    LOG_OUT_REJECTED:                   'LOG_OUT_REJECTED',
    LOG_OUT_CANCELED:                   'LOG_OUT_CANCELED',
    SESSION_EXPIRED:                    'SESSION_EXPIRED',
    SESSION_EXPIRED_CANCELED:           'SESSION_EXPIRED_CANCELED',
    UPDATE_AUTH_USER_LANGUAGE:          'UPDATE_AUTH_USER_LANGUAGE',
    UPDATE_AUTH_USER_LANGUAGE_FULFILLED:'UPDATE_AUTH_USER_LANGUAGE_FULFILLED',
    UPDATE_AUTH_USER_LANGUAGE_REJECTED: 'UPDATE_AUTH_USER_LANGUAGE_REJECTED',
    UPDATE_DASHBOARDSETTINGS:           'UPDATE_DASHBOARDSETTINGS',
    UPDATE_DASHBOARDSETTINGS_FULFILLED: 'UPDATE_DASHBOARDSETTINGS_FULFILLED',
    UPDATE_DASHBOARDSETTINGS_REJECTED:  'UPDATE_DASHBOARDSETTINGS_REJECTED',
    UPDATE_THEME:                       'UPDATE_THEME',
    UPDATE_THEME_FULFILLED:             'UPDATE_THEME_FULFILLED',
    UPDATE_THEME_REJECTED:              'UPDATE_THEME_REJECTED',
    TOGGLE_APPTOUR:                     'TOGGLE_APPTOUR',
    TOGGLE_APPTOUR_FULFILLED:           'TOGGLE_APPTOUR_FULFILLED',
    TOGGLE_APPTOUR_REJECTED:            'TOGGLE_APPTOUR_REJECTED',
};

/**
 * users' actions for redux state
 */
export const UsersAction = {
    CHECK_USEREMAIL:                    'CHECK_USEREMAIL',
    CHECK_USEREMAIL_FULFILLED:          'CHECK_USEREMAIL_FULFILLED',
    CHECK_USEREMAIL_REJECTED:           'CHECK_USEREMAIL_REJECTED',
    FETCH_USER:                         'FETCH_USER',
    FETCH_USER_FULFILLED:               'FETCH_USER_FULFILLED',
    FETCH_USER_REJECTED:                'FETCH_USER_REJECTED',
    FETCH_USER_CANCELED:                'FETCH_USER_CANCELED',
    FETCH_USERS:                        'FETCH_USERS',
    FETCH_USERS_FULFILLED:              'FETCH_USERS_FULFILLED',
    FETCH_USERS_REJECTED:               'FETCH_USERS_REJECTED',
    FETCH_USERS_CANCELED:               'FETCH_USERS_CANCELED',
    FETCH_USERS_STORE:                  'FETCH_USERS_STORE',
    ADD_USER_STORE:                     'ADD_USER_STORE',
    ADD_USER:                           'ADD_USER',
    ADD_USER_FULFILLED:                 'ADD_USER_FULFILLED',
    ADD_USER_REJECTED:                  'ADD_USER_REJECTED',
    ADD_PROFILEPICTURE:                 'ADD_PROFILEPICTURE',
    ADD_PROFILEPICTURE_FULFILLED:       'ADD_PROFILEPICTURE_FULFILLED',
    ADD_PROFILEPICTURE_REJECTED:        'ADD_PROFILEPICTURE_REJECTED',
    UPDATE_USER:                        'UPDATE_USER',
    UPDATE_USER_FULFILLED:              'UPDATE_USER_FULFILLED',
    UPDATE_USER_REJECTED:               'UPDATE_USER_REJECTED',
    UPDATE_PROFILEPICTURE:              'UPDATE_PROFILEPICTURE',
    UPDATE_PROFILEPICTURE_FULFILLED:    'UPDATE_PROFILEPICTURE_FULFILLED',
    UPDATE_PROFILEPICTURE_REJECTED:     'UPDATE_PROFILEPICTURE_REJECTED',
    UPDATE_USERDETAIL:                  'UPDATE_USERDETAIL',
    UPDATE_USERDETAIL_FULFILLED:        'UPDATE_USERDETAIL_FULFILLED',
    UPDATE_USERDETAIL_REJECTED:         'UPDATE_USERDETAIL_REJECTED',
    DELETE_USER:                        'DELETE_USER',
    DELETE_USER_FULFILLED:              'DELETE_USER_FULFILLED',
    DELETE_USER_REJECTED:               'DELETE_USER_REJECTED',
};

/**
 * usergroups' actions for redux state
 */
export const UserGroupsAction = {
    FETCH_USERGROUP:                    'FETCH_USERGROUP',
    FETCH_USERGROUP_FULFILLED:          'FETCH_USERGROUP_FULFILLED',
    FETCH_USERGROUP_REJECTED:           'FETCH_USERGROUP_REJECTED',
    FETCH_USERGROUP_CANCELED:           'FETCH_USERGROUP_CANCELED',
    FETCH_USERGROUPS:                   'FETCH_USERGROUPS',
    FETCH_USERGROUPS_FULFILLED:         'FETCH_USERGROUPS_FULFILLED',
    FETCH_USERGROUPS_REJECTED:          'FETCH_USERGROUPS_REJECTED',
    FETCH_USERGROUPS_CANCELED:          'FETCH_USERGROUPS_CANCELED',
    ADD_GROUPICON:                      'ADD_GROUPICON',
    ADD_GROUPICON_FULFILLED:            'ADD_GROUPICON_FULFILLED',
    ADD_GROUPICON_REJECTED:             'ADD_GROUPICON_REJECTED',
    ADD_USERGROUP:                      'ADD_USERGROUP',
    ADD_USERGROUP_FULFILLED:            'ADD_USERGROUP_FULFILLED',
    ADD_USERGROUP_REJECTED:             'ADD_USERGROUP_REJECTED',
    UPDATE_USERGROUP:                   'UPDATE_USERGROUP',
    UPDATE_USERGROUP_FULFILLED:         'UPDATE_USERGROUP_FULFILLED',
    UPDATE_USERGROUP_REJECTED:          'UPDATE_USERGROUP_REJECTED',
    UPDATE_GROUPICON:                   'UPDATE_GROUPICON',
    UPDATE_GROUPICON_FULFILLED:         'UPDATE_GROUPICON_FULFILLED',
    UPDATE_GROUPICON_REJECTED:          'UPDATE_GROUPICON_REJECTED',
    DELETE_USERGROUP:                   'DELETE_USERGROUP',
    DELETE_USERGROUP_FULFILLED:         'DELETE_USERGROUP_FULFILLED',
    DELETE_USERGROUP_REJECTED:          'DELETE_USERGROUP_REJECTED',
};

/**
 * components' actions for redux state
 */
export const ComponentsAction = {
    FETCH_COMPONENTS:                   'FETCH_COMPONENTS',
    FETCH_COMPONENTS_FULFILLED:         'FETCH_COMPONENTS_FULFILLED',
    FETCH_COMPONENTS_REJECTED:          'FETCH_COMPONENTS_REJECTED',
    FETCH_COMPONENTS_CANCELED:          'FETCH_COMPONENTS_CANCELED',
};

/**
 * connectors' actions for redux state
 */
export const ConnectorsAction = {
    TEST_CONNECTOR:                     'TEST_CONNECTOR',
    TEST_CONNECTOR_FULFILLED:           'TEST_CONNECTOR_FULFILLED',
    TEST_CONNECTOR_REJECTED:            'TEST_CONNECTOR_REJECTED',
    FETCH_CONNECTOR:                    'FETCH_CONNECTOR',
    FETCH_CONNECTOR_FULFILLED:          'FETCH_CONNECTOR_FULFILLED',
    FETCH_CONNECTOR_REJECTED:           'FETCH_CONNECTOR_REJECTED',
    FETCH_CONNECTOR_CANCELED:           'FETCH_CONNECTOR_CANCELED',
    FETCH_CONNECTORS:                   'FETCH_CONNECTORS',
    FETCH_CONNECTORS_FULFILLED:         'FETCH_CONNECTORS_FULFILLED',
    FETCH_CONNECTORS_REJECTED:          'FETCH_CONNECTORS_REJECTED',
    FETCH_CONNECTORS_CANCELED:          'FETCH_CONNECTORS_CANCELED',
    ADD_CONNECTOR:                      'ADD_CONNECTOR',
    ADD_CONNECTOR_FULFILLED:            'ADD_CONNECTOR_FULFILLED',
    ADD_CONNECTOR_REJECTED:             'ADD_CONNECTOR_REJECTED',
    ADD_CONNECTORICON:                  'ADD_CONNECTORICON',
    ADD_CONNECTORICON_FULFILLED:        'ADD_CONNECTORICON_FULFILLED',
    ADD_CONNECTORICON_REJECTED:         'ADD_CONNECTORICON_REJECTED',
    UPDATE_CONNECTOR:                   'UPDATE_CONNECTOR',
    UPDATE_CONNECTOR_FULFILLED:         'UPDATE_CONNECTOR_FULFILLED',
    UPDATE_CONNECTOR_REJECTED:          'UPDATE_CONNECTOR_REJECTED',
    UPDATE_CONNECTORICON:               'UPDATE_CONNECTORICON',
    UPDATE_CONNECTORICON_FULFILLED:     'UPDATE_CONNECTORICON_FULFILLED',
    UPDATE_CONNECTORICON_REJECTED:      'UPDATE_CONNECTORICON_REJECTED',
    DELETE_CONNECTOR:                   'DELETE_CONNECTOR',
    DELETE_CONNECTOR_FULFILLED:         'DELETE_CONNECTOR_FULFILLED',
    DELETE_CONNECTOR_REJECTED:          'DELETE_CONNECTOR_REJECTED',
};

/**
 * invokers' actions for redux state
 */
export const InvokersAction = {
    FETCH_INVOKERS:                      'FETCH_INVOKERS',
    FETCH_INVOKERS_FULFILLED:            'FETCH_INVOKERS_FULFILLED',
    FETCH_INVOKERS_REJECTED:             'FETCH_INVOKERS_REJECTED',
    FETCH_INVOKERS_CANCELED:             'FETCH_INVOKERS_CANCELED',
    ADD_INVOKER:                         'ADD_INVOKER',
    ADD_INVOKER_FULFILLED:               'ADD_INVOKER_FULFILLED',
    ADD_INVOKER_REJECTED:                'ADD_INVOKER_REJECTED',
    UPDATE_INVOKER:                      'UPDATE_INVOKER',
    UPDATE_INVOKER_FULFILLED:            'UPDATE_INVOKER_FULFILLED',
    UPDATE_INVOKER_REJECTED:             'UPDATE_INVOKER_REJECTED',
    DELETE_INVOKER:                      'DELETE_INVOKER',
    DELETE_INVOKER_FULFILLED:            'DELETE_INVOKER_FULFILLED',
    DELETE_INVOKER_REJECTED:             'DELETE_INVOKER_REJECTED',
};

/**
 * connections' actions for redux state
 */
export const ConnectionsAction = {
    FETCH_CONNECTION:                   'FETCH_CONNECTION',
    FETCH_CONNECTION_FULFILLED:         'FETCH_CONNECTION_FULFILLED',
    FETCH_CONNECTION_REJECTED:          'FETCH_CONNECTION_REJECTED',
    FETCH_CONNECTION_CANCELED:          'FETCH_CONNECTION_CANCELED',
    FETCH_CONNECTIONS:                  'FETCH_CONNECTIONS',
    FETCH_CONNECTIONS_FULFILLED:        'FETCH_CONNECTIONS_FULFILLED',
    FETCH_CONNECTIONS_REJECTED:         'FETCH_CONNECTIONS_REJECTED',
    FETCH_CONNECTIONS_CANCELED:         'FETCH_CONNECTIONS_CANCELED',
    ADD_CONNECTION:                     'ADD_CONNECTION',
    ADD_CONNECTION_FULFILLED:           'ADD_CONNECTION_FULFILLED',
    ADD_CONNECTION_REJECTED:            'ADD_CONNECTION_REJECTED',
    UPDATE_CONNECTION:                  'UPDATE_CONNECTION',
    UPDATE_CONNECTION_FULFILLED:        'UPDATE_CONNECTION_FULFILLED',
    UPDATE_CONNECTION_REJECTED:         'UPDATE_CONNECTION_REJECTED',
    DELETE_CONNECTION:                  'DELETE_CONNECTION',
    DELETE_CONNECTION_FULFILLED:        'DELETE_CONNECTION_FULFILLED',
    DELETE_CONNECTION_REJECTED:         'DELETE_CONNECTION_REJECTED',
    CHECK_CONNECTIONTITLE:              'CHECK_CONNECTIONTITLE',
    CHECK_CONNECTIONTITLE_FULFILLED:    'CHECK_CONNECTIONTITLE_FULFILLED',
    CHECK_CONNECTIONTITLE_REJECTED:     'CHECK_CONNECTIONTITLE_REJECTED',
};

/**
 * templates' actions for redux state
 */
export const TemplatesAction = {
    FETCH_TEMPLATES:                    'FETCH_TEMPLATES',
    FETCH_TEMPLATES_FULFILLED:          'FETCH_TEMPLATES_FULFILLED',
    FETCH_TEMPLATES_REJECTED:           'FETCH_TEMPLATES_REJECTED',
    FETCH_TEMPLATES_CANCELED:           'FETCH_TEMPLATES_CANCELED',
    ADD_TEMPLATE:                       'ADD_TEMPLATE',
    ADD_TEMPLATE_FULFILLED:             'ADD_TEMPLATE_FULFILLED',
    ADD_TEMPLATE_REJECTED:              'ADD_TEMPLATE_REJECTED',
    DELETE_TEMPLATE:                    'DELETE_TEMPLATE',
    DELETE_TEMPLATE_FULFILLED:          'DELETE_TEMPLATE_FULFILLED',
    DELETE_TEMPLATE_REJECTED:           'DELETE_TEMPLATE_REJECTED',
    IMPORT_TEMPLATE:                    'IMPORT_TEMPLATE',
    IMPORT_TEMPLATE_FULFILLED:          'IMPORT_TEMPLATE_FULFILLED',
    IMPORT_TEMPLATE_REJECTED:           'IMPORT_TEMPLATE_REJECTED',
    EXPORT_TEMPLATE:                    'EXPORT_TEMPLATE',
    EXPORT_TEMPLATE_FULFILLED:          'EXPORT_TEMPLATE_FULFILLED',
    EXPORT_TEMPLATE_REJECTED:           'EXPORT_TEMPLATE_REJECTED',
    EXPORT_TEMPLATE_CANCELED:           'EXPORT_TEMPLATE_CANCELED',
};

/**
 * schedules' actions for redux state
 */
export const SchedulesAction = {
    UPDATE_SCHEDULE_STORE:              'UPDATE_SCHEDULE_STORE',
    TRIGGER_SCHEDULESUCCESS:            'TRIGGER_SCHEDULESUCCESS',
    TRIGGER_SCHEDULESUCCESS_FULFILLED:  'TRIGGER_SCHEDULESUCCESS_FULFILLED',
    TRIGGER_SCHEDULE:                   'TRIGGER_SCHEDULE',
    TRIGGER_SCHEDULE_FULFILLED:         'TRIGGER_SCHEDULE_FULFILLED',
    TRIGGER_SCHEDULE_REJECTED:          'TRIGGER_SCHEDULE_REJECTED',
    TRIGGER_SCHEDULE_CANCELED:          'TRIGGER_SCHEDULE_CANCELED',
    FETCH_SCHEDULE:                     'FETCH_SCHEDULE',
    FETCH_SCHEDULE_FULFILLED:           'FETCH_SCHEDULE_FULFILLED',
    FETCH_SCHEDULE_REJECTED:            'FETCH_SCHEDULE_REJECTED',
    FETCH_SCHEDULE_CANCELED:            'FETCH_SCHEDULE_CANCELED',
    FETCH_SCHEDULES:                    'FETCH_SCHEDULES',
    FETCH_SCHEDULES_FULFILLED:          'FETCH_SCHEDULES_FULFILLED',
    FETCH_SCHEDULES_REJECTED:           'FETCH_SCHEDULES_REJECTED',
    FETCH_SCHEDULES_CANCELED:           'FETCH_SCHEDULES_CANCELED',
    FETCH_CURRENTSCHEDULES:             'FETCH_CURRENTSCHEDULES',
    FETCH_CURRENTSCHEDULES_FULFILLED:   'FETCH_CURRENTSCHEDULES_FULFILLED',
    FETCH_CURRENTSCHEDULES_REJECTED:    'FETCH_CURRENTSCHEDULES_REJECTED',
    FETCH_CURRENTSCHEDULES_CANCELED:    'FETCH_CURRENTSCHEDULES_CANCELED',
    FETCH_SCHEDULESBYIDS:               'FETCH_SCHEDULESBYIDS',
    FETCH_SCHEDULESBYIDS_FULFILLED:     'FETCH_SCHEDULESBYIDS_FULFILLED',
    FETCH_SCHEDULESBYIDS_REJECTED:      'FETCH_SCHEDULESBYIDS_REJECTED',
    FETCH_SCHEDULESBYIDS_CANCELED:      'FETCH_SCHEDULESBYIDS_CANCELED',
    ADD_SCHEDULE:                       'ADD_SCHEDULE',
    ADD_SCHEDULE_FULFILLED:             'ADD_SCHEDULE_FULFILLED',
    ADD_SCHEDULE_REJECTED:              'ADD_SCHEDULE_REJECTED',
    UPDATE_SCHEDULE:                    'UPDATE_SCHEDULE',
    UPDATE_SCHEDULE_FULFILLED:          'UPDATE_SCHEDULE_FULFILLED',
    UPDATE_SCHEDULE_REJECTED:           'UPDATE_SCHEDULE_REJECTED',
    UPDATE_SCHEDULESTATUS:              'UPDATE_SCHEDULESTATUS',
    UPDATE_SCHEDULESTATUS_FULFILLED:    'UPDATE_SCHEDULESTATUS_FULFILLED',
    UPDATE_SCHEDULESTATUS_REJECTED:     'UPDATE_SCHEDULESTATUS_REJECTED',
    DELETE_SCHEDULE:                    'DELETE_SCHEDULE',
    DELETE_SCHEDULE_FULFILLED:          'DELETE_SCHEDULE_FULFILLED',
    DELETE_SCHEDULE_REJECTED:           'DELETE_SCHEDULE_REJECTED',
    DELETE_SCHEDULES:                   'DELETE_SCHEDULES',
    DELETE_SCHEDULES_FULFILLED:         'DELETE_SCHEDULES_FULFILLED',
    DELETE_SCHEDULES_REJECTED:          'DELETE_SCHEDULES_REJECTED',
    START_SCHEDULES:                    'START_SCHEDULES',
    START_SCHEDULES_FULFILLED:          'START_SCHEDULES_FULFILLED',
    START_SCHEDULES_REJECTED:           'START_SCHEDULES_REJECTED',
    ENABLE_SCHEDULES:                   'ENABLE_SCHEDULES',
    ENABLE_SCHEDULES_FULFILLED:         'ENABLE_SCHEDULES_FULFILLED',
    ENABLE_SCHEDULES_REJECTED:          'ENABLE_SCHEDULES_REJECTED',
    DISABLE_SCHEDULES:                  'DISABLE_SCHEDULES',
    DISABLE_SCHEDULES_FULFILLED:        'DISABLE_SCHEDULES_FULFILLED',
    DISABLE_SCHEDULES_REJECTED:         'DISABLE_SCHEDULES_REJECTED',
};

/**
 * dashboards' actions for redux state
 */
export const DashboardsAction = {
    UPDATE_SETTINGS:                    'UPDATE_SETTINGS',
    UPDATE_SETTINGS_FULFILLED:          'UPDATE_SETTINGS_FULFILLED',
    UPDATE_SETTINGS_REJECTED:           'UPDATE_SETTINGS_REJECTED',
};

/**
 * apps' actions for redux state
 */
export const AppsAction = {
    FETCH_APPS:                         'FETCH_APPS',
    FETCH_APPS_FULFILLED:               'FETCH_APPS_FULFILLED',
    FETCH_APPS_REJECTED:                'FETCH_APPS_REJECTED',
    FETCH_APPS_CANCELED:                'FETCH_APPS_CANCELED',
    CHECK_APP:                          'CHECK_APP',
    CHECK_APP_FULFILLED:                'CHECK_APP_FULFILLED',
    CHECK_APP_REJECTED:                 'CHECK_APP_REJECTED',
    CHECK_APP_CANCELED:                 'CHECK_APP_CANCELED',
};

/**
 * webhooks' actions for redux state
 */
export const WebHooksAction = {
    FETCH_WEBHOOK:                      'FETCH_WEBHOOK',
    FETCH_WEBHOOK_FULFILLED:            'FETCH_WEBHOOK_FULFILLED',
    FETCH_WEBHOOK_REJECTED:             'FETCH_WEBHOOK_REJECTED',
    ADD_WEBHOOK:                        'ADD_WEBHOOK',
    ADD_WEBHOOK_FULFILLED:              'ADD_WEBHOOK_FULFILLED',
    ADD_WEBHOOK_REJECTED:               'ADD_WEBHOOK_REJECTED',
    UPDATE_WEBHOOK:                     'UPDATE_WEBHOOK',
    UPDATE_WEBHOOK_FULFILLED:           'UPDATE_WEBHOOK_FULFILLED',
    UPDATE_WEBHOOK_REJECTED:            'UPDATE_WEBHOOK_REJECTED',
    DELETE_WEBHOOK:                     'DELETE_WEBHOOK',
    DELETE_WEBHOOK_FULFILLED:           'DELETE_WEBHOOK_FULFILLED',
    DELETE_WEBHOOK_REJECTED:            'DELETE_WEBHOOK_REJECTED',
    COPYTOCLIPBOARD_WEBHOOK:            'COPYTOCLIPBOARD_WEBHOOK',
    COPYTOCLIPBOARD_WEBHOOK_FULFILLED:  'COPYTOCLIPBOARD_WEBHOOK_FULFILLED',
};

/**
 * admin cards' actions for redux state
 */
export const AdminCardsAction = {
    FETCH_ADMINCARDS:                    'FETCH_ADMINCARDS',
    FETCH_ADMINCARDS_FULFILLED:          'FETCH_ADMINCARDS_FULFILLED',
    FETCH_ADMINCARDS_REJECTED:           'FETCH_ADMINCARDS_REJECTED',
    FETCH_ADMINCARDS_CANCELED:           'FETCH_ADMINCARDS_CANCELED',
    LOAD_ADMINCARD:                      'LOAD_ADMINCARD',
    LOAD_ADMINCARD_FULFILLED:            'LOAD_ADMINCARD_FULFILLED',
    LOAD_ADMINCARD_REJECTED:             'LOAD_ADMINCARD_REJECTED',
};
