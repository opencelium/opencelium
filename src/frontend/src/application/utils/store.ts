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

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import logger from 'redux-logger'
import {TypedUseSelectorHook, useDispatch, useSelector} from "react-redux";
import {createStateSyncMiddleware, withReduxStateSync} from "redux-state-sync";
import {reducers, middlewares as EntitiesMiddlewares, syncStateConfig} from '@entity/index';
import authReducer from '../redux_toolkit/slices/AuthSlice';
import applicationReducer from '../redux_toolkit/slices/ApplicationSlice';
import checkConnectionReducer from '../redux_toolkit/slices/CheckConnectionSlice';

import {ICommonState} from "../interfaces/core";
import {authMiddleware} from "./middlewares/auth";
import {notificationMiddleware} from "./middlewares/notification";
import {applicationMiddleware} from "./middlewares/application";
const syncConfig: any = {
    whitelist: [
        ...syncStateConfig.whiteList,
    ],
}

const rootReducer = combineReducers({
    authReducer,
    applicationReducer,
    checkConnectionReducer,
    ...reducers,
})
const middlewares = [
    authMiddleware,
    applicationMiddleware,
    notificationMiddleware,
    ...EntitiesMiddlewares,
    createStateSyncMiddleware(syncConfig),
]

if(process.env.isDevelopment){
    // middlewares.unshift(logger);
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

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
