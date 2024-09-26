/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import {Middleware} from "redux";
import {RootState} from "@application/utils/store";
import {deepObjectsMerge} from "@application/utils/utils";
import EntityApplicationToolkit from './application/redux_toolkit';
import ConnectionToolkit from './connection/redux_toolkit';
import ConnectorToolkit from './connector/redux_toolkit';
import DashboardToolkit from './dashboard/redux_toolkit';
import ExternalApplicationToolkit from './external_application/redux_toolkit';
import InvokerToolkit from './invoker/redux_toolkit';
import NotificationTemplateToolkit from './notification_template/redux_toolkit';
import ScheduleToolkit from './schedule/redux_toolkit';
import TemplateToolkit from './template/redux_toolkit';
import UserToolkit from './user/redux-toolkit';
import UserGroupToolkit from './user_group/redux_toolkit';
import UpdateAssistantToolkit from './update_assistant/redux_toolkit'
import DataAggregatorToolkit from './data_aggregator/redux_toolkit'
import MigrationToolkit from './migrate/redux_toolkit';
import CategoryToolkit from './category/redux_toolkit';
import LicenseManagementToolkit from './license_management/redux_toolkit';
import LdapManagementToolkit from './ldap/redux_toolkit';

const ActionCreators = {
    ...ConnectionToolkit.actionCreators,
    ...ConnectorToolkit.actionCreators,
    ...DashboardToolkit.actionCreators,
    ...ExternalApplicationToolkit.actionCreators,
    ...InvokerToolkit.actionCreators,
    ...NotificationTemplateToolkit.actionCreators,
    ...ScheduleToolkit.actionCreators,
    ...TemplateToolkit.actionCreators,
    ...UserToolkit.actionCreators,
    ...UserGroupToolkit.actionCreators,
    ...UpdateAssistantToolkit.actionCreators,
    ...DataAggregatorToolkit.actionCreators,
    ...MigrationToolkit.actionCreators,
    ...CategoryToolkit.actionCreators,
    ...LicenseManagementToolkit.actionCreators,
    ...LdapManagementToolkit.actionCreators,
}

const reducers = {
    ...EntityApplicationToolkit.reducers,
    ...ConnectionToolkit.reducers,
    ...ConnectorToolkit.reducers,
    ...DashboardToolkit.reducers,
    ...ExternalApplicationToolkit.reducers,
    ...InvokerToolkit.reducers,
    ...NotificationTemplateToolkit.reducers,
    ...ScheduleToolkit.reducers,
    ...TemplateToolkit.reducers,
    ...UserToolkit.reducers,
    ...UserGroupToolkit.reducers,
    ...UpdateAssistantToolkit.reducers,
    ...DataAggregatorToolkit.reducers,
    ...MigrationToolkit.reducers,
    ...CategoryToolkit.reducers,
    ...LicenseManagementToolkit.reducers,
    ...LdapManagementToolkit.reducers,
}

const entitiesTranslations = require.context('.', true, /\/\w+\/translations\/index.ts$/);
let interpolations: any = {};
let translations: any = {};
entitiesTranslations.keys().forEach(key => {
    const exposed = entitiesTranslations(key);
    Object.keys(exposed).forEach(key => {
        if(key === 'default'){
            translations = deepObjectsMerge(translations, exposed[key]);
        }
        if(key === 'interpolations'){
            interpolations = {...interpolations, ...exposed[key]};
        }
    });
});

const entitiesMenuItems = require.context('.', true, /\/\w+\/components\/menu\/\w+.tsx$/);
let menuItems: any = [];
let orderKeys: any[] = [];
let items: any = [];
let index = 0;
entitiesMenuItems.keys().forEach(key => {
    const name = key.split('/').filter(a => (a && !a.includes('.'))).join('.');
    const exposed = entitiesMenuItems(key);
    Object.keys(exposed).forEach(key => {
        const splitComponentName = key.split('_')
        if(splitComponentName.length !== 2){
            console.error(`please, check name of the menu item: ${key}. It must follow next type: [name]_[order_number_in_menu_(starts_from_0)]`)
        } else{
            orderKeys.push({from: index, to: Number(key.split('_')[1])});
            index++;
        }
        items.push(exposed[key]);
    });
});
orderKeys.sort((a, b) => {if(a.to > b.to) return 1; if(a.to < b.to) return -1; return 0;})
for(let i = 0; i < orderKeys.length; i++){
    menuItems.push(items[orderKeys[i].from]);
}
if(menuItems.length !== items.length){
    menuItems = items;
}

const getMenuItems = ({showMenu, isReadonly, onHoverColor}: {showMenu: boolean, isReadonly: boolean, onHoverColor?: string}) => {
    return (
        <React.Fragment>
            {
                menuItems.map((menuItem: any, key: any) => {return React.createElement(menuItem, {key, isMainMenuExpanded: showMenu, isReadonly, onHoverColor})})
            }
        </React.Fragment>
    )
};

const entitiesRoutes = require.context('.', true, /\/\w+\/utils\/routes.tsx$/);
let routes: any = [];
let LoginRoute: any = null;
entitiesRoutes.keys().forEach(key => {
    const exposed = entitiesRoutes(key);
    Object.keys(exposed).forEach(componentName => {
        if(key !== './application/utils/routes.tsx') {
            routes.push(exposed[componentName]);
        } else{
            LoginRoute = exposed[componentName];
        }
    });
});

const Routes = (
    <React.Fragment>
        {
            routes.map((route: any) => {return route;})
        }
    </React.Fragment>
)


const entitiesMiddlewares = require.context('.', true, /\/\w+\/utils\/middlewares.ts$/);
let middlewares: Middleware<{}, RootState>[] = [];
entitiesMiddlewares.keys().forEach(key => {
    const exposed = entitiesMiddlewares(key);
    Object.keys(exposed).forEach(key => {
        middlewares.push(exposed[key]);
    });
});

const entitiesSyncStateConfigs = require.context('.', true, /\/\w+\/utils\/sync_state.ts$/);
let syncStateConfig: any = {whiteList: []}
entitiesSyncStateConfigs.keys().forEach(key => {
    const exposed = entitiesSyncStateConfigs(key);
    Object.keys(exposed).forEach(key => {
        if(key === 'whiteList'){
            syncStateConfig.whiteList.push(exposed[key]);
        }
    });
});

export {
    ActionCreators,
    reducers,
    translations,
    interpolations,
    getMenuItems,
    Routes,
    LoginRoute,
    middlewares,
    syncStateConfig,
}
