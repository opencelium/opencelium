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

import React from 'react';
import {Route, IndexRoute} from 'react-router';

import isAuth from '../hocs/isAuth';
import isNotAuth from '../hocs/isNotAuth';
import Layout from '@components/layout/Layout';
import PageNotFound from "@components/general/app/PageNotFound";
import LoadableRouteComponents from './LoadableRouteComponents';


/**
 * create routes for app
 */
export const createRoutes = (store) => {
    return (
        <Route path='/' component={Layout}>
            <IndexRoute component={isAuth(LoadableRouteComponents.DashboardLayout, store)}/>
            <Route path='/users' component={isAuth(LoadableRouteComponents.UserLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.UsersList}/>
                <Route path='/users/add' component={LoadableRouteComponents.UserAdd}/>
                <Route path='/users/page/:pageNumber' component={LoadableRouteComponents.UsersList}/>
                <Route path='/users/:id/view' component={LoadableRouteComponents.UserView}/>
                <Route path='/users/:id/update' component={LoadableRouteComponents.UserUpdate}/>
            </Route>
            <Route path='/usergroups' component={isAuth(LoadableRouteComponents.UserGroupLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.UserGroupsList}/>
                <Route path='/usergroups/add' component={LoadableRouteComponents.UserGroupAdd}/>
                <Route path='/usergroups/page/:pageNumber' component={LoadableRouteComponents.UserGroupsList}/>
                <Route path='/usergroups/:id/view' component={LoadableRouteComponents.UserGroupView}/>
                <Route path='/usergroups/:id/update' component={LoadableRouteComponents.UserGroupUpdate}/>
            </Route>
            <Route path='/connectors' component={isAuth(LoadableRouteComponents.ConnectorLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.ConnectorsList}/>
                <Route path='/connectors/add' component={LoadableRouteComponents.ConnectorAdd}/>
                <Route path='/connectors/page/:pageNumber' component={LoadableRouteComponents.ConnectorsList}/>
                <Route path='/connectors/:id/view' component={LoadableRouteComponents.ConnectorView}/>
                <Route path='/connectors/:id/update' component={LoadableRouteComponents.ConnectorUpdate}/>
            </Route>
            <Route path='/connections' component={isAuth(LoadableRouteComponents.ConnectionLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.ConnectionsList}/>
                <Route path='/connections/add' component={LoadableRouteComponents.ConnectionAdd}/>
                <Route path='/connections/page/:pageNumber' component={LoadableRouteComponents.ConnectionsList}/>
                <Route path='/connections/:id/view' component={LoadableRouteComponents.ConnectionView}/>
                <Route path='/connections/:id/graph' component={LoadableRouteComponents.ConnectionGraph}/>
                <Route path='/connections/:id/update' component={LoadableRouteComponents.ConnectionUpdate}/>
            </Route>
            <Route path='/schedules' component={isAuth(LoadableRouteComponents.ScheduleLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.SchedulesList}/>
                <Route path='/schedules/add' component={LoadableRouteComponents.ScheduleAdd}/>
                <Route path='/schedules/page/:pageNumber' component={LoadableRouteComponents.SchedulesList}/>
                <Route path='/schedules/:id/view' component={LoadableRouteComponents.ScheduleView}/>
                <Route path='/schedules/:id/update' component={LoadableRouteComponents.ScheduleUpdate}/>
            </Route>
            <Route path='/apps' component={isAuth(LoadableRouteComponents.AppLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.AppsList}/>
                <Route path='/apps/page/:pageNumber' component={LoadableRouteComponents.AppsList}/>
            </Route>
            <Route path='/invokers' component={isAuth(LoadableRouteComponents.InvokerLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.InvokersList}/>
                <Route path='/invokers/add' component={LoadableRouteComponents.InvokerAdd}/>
                <Route path='/invokers/page/:pageNumber' component={LoadableRouteComponents.InvokersList}/>
                <Route path='/invokers/:id/view' component={LoadableRouteComponents.InvokerView}/>
                <Route path='/invokers/:id/update' component={LoadableRouteComponents.InvokerUpdate}/>
            </Route>
            <Route path='/admin_cards' component={isAuth(LoadableRouteComponents.AdminCardLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.AdminCardsList}/>
                <Route path='/admin_cards/page/:pageNumber' component={LoadableRouteComponents.AdminCardsList}/>
            </Route>
            <Route path='/templates' component={isAuth(LoadableRouteComponents.TemplateLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.TemplatesList}/>
                <Route path='/templates/import' component={LoadableRouteComponents.TemplateImport}/>
                <Route path='/templates/page/:pageNumber' component={LoadableRouteComponents.TemplatesList}/>
            </Route>
            <Route path='/notification_templates' component={isAuth(LoadableRouteComponents.NotificationTemplateLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.NotificationTemplatesList}/>
                <Route path='/notification_templates/add' component={LoadableRouteComponents.NotificationTemplateAdd}/>
                <Route path='/notification_templates/page/:pageNumber' component={LoadableRouteComponents.NotificationTemplatesList}/>
                <Route path='/notification_templates/:id/view' component={LoadableRouteComponents.NotificationTemplateView}/>
                <Route path='/notification_templates/:id/update' component={LoadableRouteComponents.NotificationTemplateUpdate}/>
            </Route>
            <Route path='/connection_overview_details' component={isAuth(LoadableRouteComponents.ConnectionOverviewDetails, store)}/>
            <Route path='/connection_overview_technical_layout' component={isAuth(LoadableRouteComponents.ConnectionOverviewTechnicalLayout, store)}/>
            <Route path='/connection_overview_business_layout' component={isAuth(LoadableRouteComponents.ConnectionOverviewBusinessLayout, store)}/>
            <Route path='/template_converter' component={isAuth(LoadableRouteComponents.TemplateConverterLayout, store)}/>
            <Route path='/update_assistant' component={isAuth(LoadableRouteComponents.UpdateAssistantLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.UpdateAssistant}/>
            </Route>
            <Route path='/update_subscription' component={isAuth(LoadableRouteComponents.UpdateSubscriptionLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.UpdateSubscription}/>
            </Route>
            <Route path='/myprofile' component={isAuth(LoadableRouteComponents.MyProfileLayout, store)}>
                <IndexRoute component={LoadableRouteComponents.MyProfile}/>
            </Route>
            <Route path='/sandbox' component={isAuth(LoadableRouteComponents.Sandbox, store)}/>
            <Route path='/login' component={isNotAuth(LoadableRouteComponents.Login, store)}/>
            <Route path='/*' component={PageNotFound}/>
        </Route>
    );
};