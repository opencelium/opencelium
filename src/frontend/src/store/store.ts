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
import {setItems, setArrows, setCurrentTechnicalItem, setCurrentBusinessItem, setDetailsLocation, } from "@slice/connection/ConnectionSlice";
import {applicationMiddleware} from "../middlewares/application";
const syncConfig: any = {
    whitelist: [
        setItems.type,
        setArrows.type,
        setCurrentTechnicalItem.type,
        setCurrentBusinessItem.type,
        setDetailsLocation.type,
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
    logger,
    authMiddleware,
    applicationMiddleware,
    notificationMiddleware,
    createStateSyncMiddleware(syncConfig),
]

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