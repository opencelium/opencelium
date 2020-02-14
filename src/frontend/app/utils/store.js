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

import {createStore, applyMiddleware, compose} from 'redux';
import createLogger from 'redux-logger';
import {createEpicMiddleware} from 'redux-observable';

import notificationMiddleware from '../middlewares/notification';
import errorHandlingMiddleware from '../middlewares/error_handling';
import resourceMappingMiddleware from '../middlewares/resource_mapping';
import frontBackMappingMiddleware from '../middlewares/front_back_mapping';
import { combinedReducers } from './reducers';
import epics from './epics';

import {responsiveStoreEnhancer} from 'redux-responsive';
import {AppSettings} from "./constants/app";


const initialEnhancers  = [responsiveStoreEnhancer];

/**
 * define options for redux-logger middleware
 */
let loggerOptions = {
    collapsed: false,
    timestamp: true,

    colors: {
        title: () => '#bbbbbb',
        prevState: () => '#9E9E9E',
        action: () => '#03A9F4',
        nextState: () => '#4CAF50',
        error: () => '#F20404',
    },
};

let enhancers = {};

let initialMiddleware = [];

/**
 * define middlewares
 */
const epicMiddleware = createEpicMiddleware(epics);
let middleware = [errorHandlingMiddleware, notificationMiddleware, resourceMappingMiddleware, frontBackMappingMiddleware, epicMiddleware];

if (AppSettings.reduxHasLogs){
    initialMiddleware = [createLogger(loggerOptions)];
}

const composeEnhancers = compose();

/**
 * creates store for app including reducers, moddlewares and additional enhancers
 */
const store = createStore(
    combinedReducers,
    composeEnhancers(
        applyMiddleware(...initialMiddleware, ...middleware),
        ...initialEnhancers,
        ...enhancers
    )
);

export default store;
