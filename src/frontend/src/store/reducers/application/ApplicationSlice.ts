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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {CommonState} from "../../store";
import {ICommonState} from "@interface/application/core";
import {
    ApplicationVersionResponseProps,
    GlobalSearchResponseProps,
    ResourcesProps
} from "@requestInterface/application/IApplication";
import {IComponent} from "@interface/application/IComponent";
import {
    addTicket,
    getAllComponents,
    getGlobalSearchData,
    getResources,
    getVersion,
    openExternalUrl,
    updateResources
} from "@action/application/ApplicationCreators";
import {IApplicationResponse, IResponse} from "@requestInterface/application/IResponse";
import {INotification} from "@interface/application/INotification";
import {LocalStorage} from "@class/application/LocalStorage";
import {ViewType} from "@organism/collection_view/CollectionView";
import {GridViewType} from "@molecule/list/GridViewMenu";
import {ConnectionViewProps, ConnectionViewType} from "@page/connection/interfaces";

/*
* TODO: implement set current page items
*/

export interface AuthState extends ICommonState{
    addingTicket: API_REQUEST_STATE,
    gettingVersion: API_REQUEST_STATE,
    gettingResources: API_REQUEST_STATE,
    gettingGlobalSearchData: API_REQUEST_STATE,
    gettingComponents: API_REQUEST_STATE,
    updatingResources: API_REQUEST_STATE,
    openingExternalUrl: API_REQUEST_STATE,
    isNotificationPanelOpened: boolean,
    version: string,
    resources: ResourcesProps,
    globalSearchData: GlobalSearchResponseProps,
    components: IComponent[],
    notifications: INotification[],
    isComponentExternalInChangeContent: boolean,
    isFullScreen: boolean,
    isDraftOpenedOnce: boolean,
    connectionViewType: ConnectionViewType,
    viewType: ViewType,
    gridViewType: GridViewType,
    searchValue: string,
    currentPageItems: any[],
}


const storage = LocalStorage.getStorage();
const notifications: INotification[] = storage.get('notifications');
const version: string = storage.get('appVersion');
const viewType: ViewType = storage.get('viewType');
const gridViewType: GridViewType = storage.get('gridViewType');
const connectionViewType: ConnectionViewType = storage.get('connectionViewType');
const initialState: AuthState = {
    addingTicket: API_REQUEST_STATE.INITIAL,
    gettingVersion: API_REQUEST_STATE.INITIAL,
    gettingResources: API_REQUEST_STATE.INITIAL,
    gettingGlobalSearchData: API_REQUEST_STATE.INITIAL,
    gettingComponents: API_REQUEST_STATE.INITIAL,
    updatingResources: API_REQUEST_STATE.INITIAL,
    openingExternalUrl: API_REQUEST_STATE.INITIAL,
    isNotificationPanelOpened: false,
    version: version || '',
    resources: null,
    globalSearchData: null,
    components: [],
    notifications: notifications || [],
    isComponentExternalInChangeContent: false,
    isFullScreen: false,
    isDraftOpenedOnce: false,
    viewType: viewType || ViewType.LIST,
    gridViewType: gridViewType || 4,
    connectionViewType: connectionViewType || ConnectionViewProps.Diagram,
    searchValue: '',
    currentPageItems: [],
    ...CommonState,
}

export const applicationSlice = createSlice({
    name: 'application',
    initialState,
    reducers: {
        toggleNotificationPanel: (state) => {
            state.isNotificationPanelOpened = !state.isNotificationPanelOpened;
        },
        clearAllNotifications: (state) => {
            state.notifications = [];
            state.isNotificationPanelOpened = false;
        },
        addNotification: (state, action: PayloadAction<INotification>) => {
            state.notifications.unshift(action.payload);
        },
        clearNotification: (state, action: PayloadAction<INotification>) => {
            state.notifications = state.notifications.filter(notification => notification.id !== action.payload.id);
            if(state.notifications.length === 0){
                state.isNotificationPanelOpened = false;
            }
        },
        setComponentInChangeContent: (state, action: PayloadAction<boolean>) => {
            state.isComponentExternalInChangeContent = action.payload;
        },
        setConnectionDraftToOpenOnce: (state, action: PayloadAction<boolean>) => {
            state.isDraftOpenedOnce = true;
        },
        setConnectionViewType: (state, action: PayloadAction<ConnectionViewType>) => {
            state.connectionViewType = action.payload;
        },
        setViewType: (state, action: PayloadAction<ViewType>) => {
            state.viewType = action.payload;
        },
        setGridViewType: (state, action: PayloadAction<GridViewType>) => {
            state.gridViewType = action.payload;
        },
        setFullScreen: (state, action: PayloadAction<boolean>) => {
            state.isFullScreen = action.payload;
        },
        setSearchValue: (state, action: PayloadAction<string>) => {
            state.searchValue = action.payload;
        },
    },
    extraReducers: {
        [addTicket.pending.type]: (state) => {
            state.addingTicket = API_REQUEST_STATE.START;
        },
        [addTicket.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingTicket = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [addTicket.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingTicket = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getVersion.pending.type]: (state) => {
            state.gettingVersion = API_REQUEST_STATE.START;
        },
        [getVersion.fulfilled.type]: (state, action: PayloadAction<ApplicationVersionResponseProps>) => {
            state.gettingVersion = API_REQUEST_STATE.FINISH;
            state.version = action.payload.version;
            state.error = null;
        },
        [getVersion.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingVersion = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getResources.pending.type]: (state) => {
            state.gettingResources = API_REQUEST_STATE.START;
        },
        [getResources.fulfilled.type]: (state, action: PayloadAction<IApplicationResponse<ResourcesProps>>) => {
            state.gettingResources = API_REQUEST_STATE.FINISH;
            state.resources = action.payload.data;
            state.error = null;
            state.updatingResources = API_REQUEST_STATE.INITIAL;
        },
        [getResources.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingResources = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getGlobalSearchData.pending.type]: (state) => {
            state.gettingGlobalSearchData = API_REQUEST_STATE.START;
        },
        [getGlobalSearchData.fulfilled.type]: (state, action: PayloadAction<GlobalSearchResponseProps>) => {
            state.gettingGlobalSearchData = API_REQUEST_STATE.FINISH;
            state.globalSearchData = action.payload;
            state.error = null;
        },
        [getGlobalSearchData.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingGlobalSearchData = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllComponents.pending.type]: (state) => {
            state.gettingComponents = API_REQUEST_STATE.START;
        },
        [getAllComponents.fulfilled.type]: (state, action: PayloadAction<IComponent[]>) => {
            state.gettingComponents = API_REQUEST_STATE.FINISH;
            state.components = action.payload;
            state.error = null;
        },
        [getAllComponents.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingComponents = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateResources.pending.type]: (state) => {
            state.updatingResources = API_REQUEST_STATE.START;
        },
        [updateResources.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingResources = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [updateResources.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingResources = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [openExternalUrl.pending.type]: (state) => {
            state.openingExternalUrl = API_REQUEST_STATE.START;
        },
        [openExternalUrl.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.openingExternalUrl = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [openExternalUrl.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.openingExternalUrl = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    addNotification, clearNotification, toggleNotificationPanel, clearAllNotifications,
    setComponentInChangeContent, setConnectionDraftToOpenOnce,setGridViewType,
    setConnectionViewType, setViewType, setFullScreen, setSearchValue,
} = applicationSlice.actions;

export default applicationSlice.reducer;