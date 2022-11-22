/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {CommonState} from "@application/utils/store";
import {ICommonState} from "@application/interfaces/core";
import {LocalStorage} from "@application/classes/LocalStorage";
import {
    addConnection, checkConnectionTitle, deleteConnectionById,
    deleteConnectionsById, getAllConnections, getAllMetaConnections, getAndUpdateConnection,
    getConnectionById, updateConnection,
} from "../action_creators/ConnectionCreators";
import {IConnection} from "../../interfaces/IConnection";
import {PANEL_LOCATION} from "../../components/utils/constants/app";

const COLOR_MODE = {
    RECTANGLE_TOP: 'RECTANGLE_TOP',
    BACKGROUND: 'BACKGROUND_COLOR',
    CIRCLE_LEFT_TOP: 'CIRCLE_LEFT_TOP',
};

export interface ConnectionState extends ICommonState{
    connections: IConnection[],
    metaConnections: IConnection[],
    isCurrentConnectionHasUniqueTitle: TRIPLET_STATE,
    checkingConnectionTitle: API_REQUEST_STATE,
    addingConnection: API_REQUEST_STATE,
    updatingConnection: API_REQUEST_STATE,
    gettingConnection: API_REQUEST_STATE,
    gettingConnections: API_REQUEST_STATE,
    gettingMetaConnections: API_REQUEST_STATE,
    deletingConnectionById: API_REQUEST_STATE,
    deletingConnectionsById: API_REQUEST_STATE,
    currentConnection: IConnection,
    /*
    * TODO: rework during the the connection cleaning
    */
    currentTechnicalItem: any,
    connection: any,
    updateConnection: any,
    items: any[],
    arrows: any[],
    notificationData: any,
    detailsLocation: string,
    technicalLayoutLocation: string,
    colorMode: string,
    isCreateElementPanelOpened: boolean,
    isDraftOpenedOnce: boolean,
}


let initialState: ConnectionState = {
    connections: [],
    metaConnections: [],
    isCurrentConnectionHasUniqueTitle: TRIPLET_STATE.INITIAL,
    checkingConnectionTitle: API_REQUEST_STATE.INITIAL,
    addingConnection: API_REQUEST_STATE.INITIAL,
    updatingConnection: API_REQUEST_STATE.INITIAL,
    gettingConnection: API_REQUEST_STATE.INITIAL,
    gettingConnections: API_REQUEST_STATE.INITIAL,
    gettingMetaConnections: API_REQUEST_STATE.INITIAL,
    deletingConnectionById: API_REQUEST_STATE.INITIAL,
    deletingConnectionsById: API_REQUEST_STATE.INITIAL,
    currentConnection: null,
    currentTechnicalItem: null,
    connection: null,
    updateConnection: null,
    items: [],
    arrows: [],
    notificationData: {},
    detailsLocation: PANEL_LOCATION.SAME_WINDOW,
    technicalLayoutLocation: PANEL_LOCATION.SAME_WINDOW,
    colorMode: COLOR_MODE.RECTANGLE_TOP,
    isCreateElementPanelOpened: false,
    isDraftOpenedOnce: false,
    ...CommonState,
};
const storage = LocalStorage.getStorage();

export const connectionSlice = createSlice({
    name: 'connection',
    initialState,
    reducers: {
        setColorMode: (state, action: PayloadAction<string>) => {
            state.colorMode = action.payload;
        },
        setPanelConfigurations: (state, action: PayloadAction<any>) => {
            state.colorMode = action.payload.colorMode;
        },
        setConnectionData: (state, action: PayloadAction<any>) => {
            state.connection = action.payload.connection;
            if(action.payload.updateConnection){
                state.updateConnection = action.payload.updateConnection;
            }
        },
        setArrows: (state, action: PayloadAction<any[]>) => {
            state.arrows = action.payload;
        },
        setItems: (state, action: PayloadAction<any[]>) => {
            state.items = action.payload;
        },
        setCurrentTechnicalItem: (state, action: PayloadAction<any>) => {
            state.currentTechnicalItem = action.payload;
            state.isCreateElementPanelOpened = action.payload !== null;
        },
        setDetailsLocation: (state, action: PayloadAction<any>) => {
            state.detailsLocation = action.payload.location;
        },
        setTechnicalLayoutLocation: (state, action: PayloadAction<any>) => {
            state.technicalLayoutLocation = action.payload.location;
        },
        setConnectionDraftWasOpened: (state, action: PayloadAction<never>) => {
            state.isDraftOpenedOnce = true;
        },
    },
    extraReducers: {
        [checkConnectionTitle.pending.type]: (state) => {
            state.checkingConnectionTitle = API_REQUEST_STATE.START;
            state.isCurrentConnectionHasUniqueTitle = TRIPLET_STATE.INITIAL;
        },
        [checkConnectionTitle.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingConnectionTitle = API_REQUEST_STATE.FINISH;
            state.isCurrentConnectionHasUniqueTitle = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkConnectionTitle.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingConnectionTitle = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addConnection.pending.type]: (state, action: PayloadAction<IConnection>) => {
            state.addingConnection = API_REQUEST_STATE.START;
        },
        [addConnection.fulfilled.type]: (state, action: PayloadAction<IConnection>) => {
            state.addingConnection = API_REQUEST_STATE.FINISH;
            state.connections.push(action.payload);
            state.metaConnections.push(action.payload);
            state.error = null;
        },
        [addConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAndUpdateConnection.pending.type]: (state, action: any) => {
            state.updatingConnection = API_REQUEST_STATE.START;
        },
        [getAndUpdateConnection.fulfilled.type]: (state, action: PayloadAction<IConnection>) => {
            state.updatingConnection = API_REQUEST_STATE.FINISH;
            state.connections = state.connections.map(connection => connection.connectionId === action.payload.connectionId ? action.payload : connection);
            state.metaConnections = state.metaConnections.map(connection => connection.connectionId === action.payload.connectionId ? action.payload : connection);
            state.error = null;
        },
        [getAndUpdateConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateConnection.pending.type]: (state) => {
            state.updatingConnection = API_REQUEST_STATE.START;
        },
        [updateConnection.fulfilled.type]: (state, action: PayloadAction<IConnection>) => {
            state.updatingConnection = API_REQUEST_STATE.FINISH;
            state.connections = state.connections.map(connection => connection.connectionId === action.payload.connectionId ? action.payload : connection);
            state.metaConnections = state.metaConnections.map(connection => connection.connectionId === action.payload.connectionId ? action.payload : connection);
            if(state.currentConnection && state.currentConnection.connectionId === action.payload.connectionId){
                state.currentConnection = action.payload;
            }
            state.error = null;
        },
        [updateConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getConnectionById.pending.type]: (state) => {
            state.gettingConnection = API_REQUEST_STATE.START;
        },
        [getConnectionById.fulfilled.type]: (state, action: PayloadAction<IConnection>) => {
            state.gettingConnection = API_REQUEST_STATE.FINISH;
            state.currentConnection = action.payload;
            state.error = null;
        },
        [getConnectionById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllConnections.pending.type]: (state) => {
            state.gettingConnections = API_REQUEST_STATE.START;
        },
        [getAllConnections.fulfilled.type]: (state, action: PayloadAction<IConnection[]>) => {
            state.gettingConnections = API_REQUEST_STATE.FINISH;
            state.connections = action.payload;
            state.error = null;
        },
        [getAllConnections.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingConnections = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllMetaConnections.pending.type]: (state) => {
            state.gettingMetaConnections = API_REQUEST_STATE.START;
        },
        [getAllMetaConnections.fulfilled.type]: (state, action: PayloadAction<IConnection[]>) => {
            state.gettingMetaConnections = API_REQUEST_STATE.FINISH;
            state.metaConnections = action.payload;
            state.error = null;
        },
        [getAllMetaConnections.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingMetaConnections = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteConnectionById.pending.type]: (state) => {
            state.deletingConnectionById = API_REQUEST_STATE.START;
        },
        [deleteConnectionById.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingConnectionById = API_REQUEST_STATE.FINISH;
            state.connections = state.connections.filter(connection => connection.connectionId !== action.payload);
            state.metaConnections = state.metaConnections.filter(connection => connection.connectionId !== action.payload);
            if(state.currentConnection && state.currentConnection.connectionId === action.payload){
                state.currentConnection = null;
            }
            state.error = null;
        },
        [deleteConnectionById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingConnectionById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteConnectionsById.pending.type]: (state) => {
            state.deletingConnectionsById = API_REQUEST_STATE.START;
        },
        [deleteConnectionsById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingConnectionsById = API_REQUEST_STATE.FINISH;
            state.connections = state.connections.filter(connection => action.payload.findIndex(id => `${id}` === `${connection.connectionId}`) === -1);
            state.metaConnections = state.metaConnections.filter(connection => action.payload.findIndex(id => `${id}` === `${connection.connectionId}`) === -1);
            if(state.currentConnection && action.payload.findIndex(id => `${id}` === `${state.currentConnection.connectionId}`) !== -1){
                state.currentConnection = null;
            }
            state.error = null;
        },
        [deleteConnectionsById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingConnectionsById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    setColorMode, setPanelConfigurations,
    setConnectionData, setArrows, setItems, setCurrentTechnicalItem,
    setDetailsLocation, setTechnicalLayoutLocation,
    setConnectionDraftWasOpened,
} = connectionSlice.actions;

export default connectionSlice.reducer;