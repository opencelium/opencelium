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
import React from 'react';
import Loadable from 'react-loadable';
import Loading from "@loading";



/**
 * Loadable Users
 */
const UserLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'user_layout' */ '@components/content/users/UserLayout'),
    loading: Loading,
});
const UsersList = Loadable({
    loader: () => import(/* webpackChunkName: 'user_list' */ '@components/content/users/list/UsersList'),
    loading: Loading,
});
const UserAdd =  Loadable({
    loader: () => import(/* webpackChunkName: 'user_add' */ '@components/content/users/add/UserAdd'),
    loading: Loading,
});
const UserView =  Loadable({
    loader: () => import(/* webpackChunkName: 'user_view' */ '@components/content/users/view/UserView'),
    loading: Loading,
});
const UserUpdate =  Loadable({
    loader: () => import(/* webpackChunkName: 'user_update' */ '@components/content/users/update/UserUpdate'),
    loading: Loading,
});

/**
 * Loadable UserGroups
 */
const UserGroupLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'user_group_layout' */ '@components/content/user_groups/UserGroupLayout'),
    loading: Loading,
});
const UserGroupsList = Loadable({
    loader: () => import(/* webpackChunkName: 'user_group_list' */ '@components/content/user_groups/list/UserGroupsList'),
    loading: Loading,
});
const UserGroupAdd =  Loadable({
    loader: () => import(/* webpackChunkName: 'user_group_add' */ '@components/content/user_groups/add/UserGroupAdd'),
    loading: Loading,
});
const UserGroupView =  Loadable({
    loader: () => import(/* webpackChunkName: 'user_group_view' */ '@components/content/user_groups/view/UserGroupView'),
    loading: Loading,
});
const UserGroupUpdate =  Loadable({
    loader: () => import(/* webpackChunkName: 'user_group_update' */ '@components/content/user_groups/update/UserGroupUpdate'),
    loading: Loading,
});

/**
 * Loadable Connectors
 */
const ConnectorLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'connector_layout' */ '@components/content/connectors/ConnectorLayout'),
    loading: Loading,
});
const ConnectorsList = Loadable({
    loader: () => import(/* webpackChunkName: 'connector_list' */ '@components/content/connectors/list/ConnectorsList'),
    loading: Loading,
});
const ConnectorAdd =  Loadable({
    loader: () => import(/* webpackChunkName: 'connector_add' */ '@components/content/connectors/add/ConnectorAdd'),
    loading: Loading,
});
const ConnectorView =  Loadable({
    loader: () => import(/* webpackChunkName: 'connector_view' */ '@components/content/connectors/view/ConnectorView'),
    loading: Loading,
});
const ConnectorUpdate =  Loadable({
    loader: () => import(/* webpackChunkName: 'connector_update' */ '@components/content/connectors/update/ConnectorUpdate'),
    loading: Loading,
});

/**
 * Loadable Connections
 */
const ConnectionLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'connection_layout' */ '@components/content/connections/ConnectionLayout'),
    loading: Loading,
});
const ConnectionsList = Loadable({
    loader: () => import(/* webpackChunkName: 'connection_list' */ '@components/content/connections/list/ConnectionsList'),
    loading: Loading,
});
const ConnectionAdd =  Loadable({
    loader: () => import(/* webpackChunkName: 'connection_add' */ '@components/content/connections/add/ConnectionAdd'),
    loading: Loading,
});
const ConnectionView =  Loadable({
    loader: () => import(/* webpackChunkName: 'connection_view' */ '@components/content/connections/view/ConnectionView'),
    loading: Loading,
});
const ConnectionGraph =  Loadable({
    loader: () => import(/* webpackChunkName: 'connection_graph' */ '@components/content/connections/view/ConnectionGraph'),
    loading: Loading,
});
const ConnectionUpdate =  Loadable({
    loader: () => import(/* webpackChunkName: 'connection_update' */ '@components/content/connections/update/ConnectionUpdate'),
    loading: Loading,
});

/**
 * Loadable Schedule
 */
const ScheduleLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'schedule_layout' */ '@components/content/schedules/ScheduleLayout'),
    loading: Loading,
});
const Scheduler = Loadable({
    loader: () => import(/* webpackChunkName: 'scheduler' */ '@components/content/schedules/Schedule'),
    loading: Loading,
});

/**
 * Loadable Apps
 */
const AppLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'app_layout' */ '@components/content/apps/AppLayout'),
    loading: Loading,
});
const AppsList = Loadable({
    loader: () => import(/* webpackChunkName: 'app_list' */ '@components/content/apps/list/AppsList'),
    loading: Loading,
});

/**
 * Loadable MyProfile
 */
const MyProfileLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'my_profile_layout' */ '@components/content/my_profile/MyProfileLayout'),
    loading: Loading,
});
const MyProfile = Loadable({
    loader: () => import(/* webpackChunkName: 'my_profile' */ '@components/content/my_profile/MyProfile'),
    loading: Loading,
});

/**
 * Loadable Login
 */
const Login = Loadable({
    loader: () => import(/* webpackChunkName: 'login' */ '@components/layout/login/LoginPage'),
    loading: Loading,
});

/**
 * Loadable Home
 */
const Home = Loadable({
    loader: () => import(/* webpackChunkName: 'home' */ '@components/content/home/Home'),
    loading: Loading,
});

/**
 * Loadable Invokers
 */
const InvokerLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'invoker_layout' */ '@components/content/invokers/InvokerLayout'),
    loading: Loading,
});
const InvokersList = Loadable({
    loader: () => import(/* webpackChunkName: 'invoker_list' */ '@components/content/invokers/list/InvokersList'),
    loading: Loading,
});
const InvokerAdd =  Loadable({
    loader: () => import(/* webpackChunkName: 'invoker_add' */ '@components/content/invokers/add/InvokerAdd'),
    loading: Loading,
});
const InvokerView =  Loadable({
    loader: () => import(/* webpackChunkName: 'invoker_view' */ '@components/content/invokers/view/InvokerView'),
    loading: Loading,
});
const InvokerUpdate =  Loadable({
    loader: () => import(/* webpackChunkName: 'invoker_update' */ '@components/content/invokers/update/InvokerUpdate'),
    loading: Loading,
});

/**
 * Loadable Admin Pages
 */
const AdminCardLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'admin_card_layout' */ '@components/content/admin_cards/AdminCardLayout'),
    loading: Loading,
});
const AdminCardsList = Loadable({
    loader: () => import(/* webpackChunkName: 'admin_card_list' */ '@components/content/admin_cards/list/AdminCardsList'),
    loading: Loading,
});

/**
 * Loadable Dashboard Page
 */
const DashboardLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'dashboard_layout' */ '@components/content/dashboard/DashboardLayout'),
    loading: Loading,
});
const DashboardView = Loadable({
    loader: () => import(/* webpackChunkName: 'dashboard_view' */ '@components/content/dashboard/view/DashboardView'),
    loading: Loading,
});

/**
 * Loadable Invokers
 */
const TemplateLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'template_layout' */ '@components/content/templates/TemplateLayout'),
    loading: Loading,
});
const TemplatesList = Loadable({
    loader: () => import(/* webpackChunkName: 'template_list' */ '@components/content/templates/list/TemplatesList'),
    loading: Loading,
});
const TemplateImport =  Loadable({
    loader: () => import(/* webpackChunkName: 'template_import' */ '@components/content/templates/import/TemplateImport'),
    loading: Loading,
});

/**
 * Loadable Notification Template
 */
const NotificationTemplateLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'notification_template_layout' */ '@components/content/notification_templates/NotificationTemplateLayout'),
    loading: Loading,
});
const NotificationTemplatesList = Loadable({
    loader: () => import(/* webpackChunkName: 'notification_template_list' */ '@components/content/notification_templates/list/NotificationTemplatesList'),
    loading: Loading,
});
const NotificationTemplateAdd =  Loadable({
    loader: () => import(/* webpackChunkName: 'notification_template_add' */ '@components/content/notification_templates/add/NotificationTemplateAdd'),
    loading: Loading,
});
const NotificationTemplateView =  Loadable({
    loader: () => import(/* webpackChunkName: 'notification_template_view' */ '@components/content/notification_templates/view/NotificationTemplateView'),
    loading: Loading,
});
const NotificationTemplateUpdate =  Loadable({
    loader: () => import(/* webpackChunkName: 'notification_template_update' */ '@components/content/notification_templates/update/NotificationTemplateUpdate'),
    loading: Loading,
});

/**
 * Loadable Template Converter
 */
const TemplateConverterLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'template_converter_layout' */ '@components/content/template_converter/TemplateConverterLayout'),
    loading: Loading,
});

/**
 * Loadable Update Assistant
 */
const UpdateAssistantLayout = Loadable({
    loader: () => import(/* webpackChunkName: 'update_assistant_layout' */ '@components/content/update_assistant/UpdateAssistantLayout'),
    loading: Loading,
});
const UpdateAssistant = Loadable({
    loader: () => import(/* webpackChunkName: 'update_assistant' */ '@components/content/update_assistant/UpdateAssistant'),
    loading: Loading,
});

export default {
    UserLayout,
    UserAdd,
    UsersList,
    UserView,
    UserUpdate,
    UserGroupLayout,
    UserGroupAdd,
    UserGroupsList,
    UserGroupView,
    UserGroupUpdate,
    ConnectorLayout,
    ConnectorAdd,
    ConnectorsList,
    ConnectorView,
    ConnectorUpdate,
    ConnectionLayout,
    ConnectionAdd,
    ConnectionsList,
    ConnectionView,
    ConnectionGraph,
    ConnectionUpdate,
    ScheduleLayout,
    Scheduler,
    AppLayout,
    AppsList,
    MyProfileLayout,
    MyProfile,
    Login,
    Home,
    InvokerLayout,
    InvokerAdd,
    InvokersList,
    InvokerView,
    InvokerUpdate,
    AdminCardLayout,
    AdminCardsList,
    DashboardLayout,
    DashboardView,
    TemplateLayout,
    TemplatesList,
    TemplateImport,
    NotificationTemplateLayout,
    NotificationTemplateAdd,
    NotificationTemplatesList,
    NotificationTemplateView,
    NotificationTemplateUpdate,
    TemplateConverterLayout,
    UpdateAssistantLayout,
    UpdateAssistant,
};