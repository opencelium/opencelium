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

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import logger from 'redux-logger'
import userReducer from './reducers/UserSlice';
import authReducer from './reducers/application/AuthSlice';
import userGroupReducer from './reducers/UserGroupSlice';
import connectorReducer from './reducers/ConnectorSlice';
import invokerReducer from './reducers/InvokerSlice';
import templateReducer from './reducers/connection/TemplateSlice';
import connectionReducer from './reducers/connection/ConnectionSlice';
import scheduleReducer from './reducers/schedule/ScheduleSlice';
import scheduleNotificationReducer from './reducers/schedule/NotificationSlice';
import scheduleNotificationTemplateReducer from './reducers/schedule/NotificationTemplateSlice';
import updateAssistantReducer from './reducers/application/UpdateAssistantSlice';
import externalApplicationReducer from './reducers/external_application/ExternalApplicationSlice';
import applicationReducer from './reducers/application/ApplicationSlice';
import widgetReducer from './reducers/dashboard/WidgetSlice';
import widgetSettingReducer from './reducers/dashboard/WidgetSettingSlice';
import graphQLReducer from './reducers/graphql/GraphQLSlice';
import {ICommonState} from "@interface/application/core";
import {authMiddleware} from "../middlewares/auth";
import {notificationMiddleware} from "../middlewares/notification";

import {createStateSyncMiddleware, withReduxStateSync} from "redux-state-sync";
import {setItems, setArrows, setCurrentTechnicalItem, setCurrentBusinessItem, setDetailsLocation, setConnectionData } from "@slice/connection/ConnectionSlice";
import {applicationMiddleware} from "../middlewares/application";
import {themeMiddleware} from "../middlewares/theme";
const syncConfig: any = {
    whitelist: [
        setItems.type,
        setArrows.type,
        setCurrentTechnicalItem.type,
        setCurrentBusinessItem.type,
        setDetailsLocation.type,
        setConnectionData.type,
    ],
}

const rootReducer = combineReducers({
    authReducer,
    userReducer,
    userGroupReducer,
    connectorReducer,
    invokerReducer,
    templateReducer,
    connectionReducer,
    scheduleReducer,
    scheduleNotificationReducer,
    scheduleNotificationTemplateReducer,
    updateAssistantReducer,
    externalApplicationReducer,
    applicationReducer,
    widgetReducer,
    widgetSettingReducer,
    graphQLReducer,
})

const middlewares = [
    authMiddleware,
    themeMiddleware,
    applicationMiddleware,
    notificationMiddleware,
    createStateSyncMiddleware(syncConfig),
]

if(process.env.isDevelopment){
    middlewares.unshift(logger);
}

export const setupStore = () => {
    return configureStore({
        reducer: withReduxStateSync(rootReducer),
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware()
                .concat(middlewares)
    })
}

export const store = setupStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
export const CommonState: ICommonState = {
    message: '',
    error: null,
};