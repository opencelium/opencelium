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

import { createSlice, PayloadAction, current, SliceCaseReducers, CaseReducers } from "@reduxjs/toolkit";
import {
  API_REQUEST_STATE,
  TRIPLET_STATE,
} from "@application/interfaces/IApplication";
import {
  IResponse,
  ResponseMessages,
} from "@application/requests/interfaces/IResponse";
import { CommonState } from "@application/utils/store";
import { ICommonState } from "@application/interfaces/core";
import {
  addConnection,
  addTestConnection,
  checkConnectionTitle,
  deleteConnectionById,
  deleteConnectionsById,
  deleteTestConnectionById,
  getAllConnections,
  getAllMetaConnections,
  getAndUpdateConnection,
  getConnectionById,
  testConnection,
  updateConnection,
} from "../action_creators/ConnectionCreators";
import { ConnectionLogProps, IConnection } from "../../interfaces/IConnection";
import { PANEL_LOCATION } from "../../components/utils/constants/app";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import { NoInfer } from "@reduxjs/toolkit/dist/tsHelpers";
import {COLOR_MODE} from "@classes/content/connection_overview_2/CSvg";


export const LogPanelHeight = {
  Medium: 270,
  High: 350,
};

export interface ConnectionState extends ICommonState {
  isAnimationNotFound: boolean;
  animationSpeed: number;
  isSavePanelVisible: boolean;
  isTemplatePanelVisible: boolean;
  videoAnimationName: string;
  isAnimationPreviewPanelOpened: boolean;
  isButtonPanelOpened: boolean;
  moveTestButton: number;
  connections: IConnection[];
  metaConnections: IConnection[];
  isCurrentConnectionHasUniqueTitle: TRIPLET_STATE;
  checkingConnectionTitle: API_REQUEST_STATE;
  testingConnection: API_REQUEST_STATE;
  addingConnection: API_REQUEST_STATE;
  addingTestConnection: API_REQUEST_STATE;
  updatingConnection: API_REQUEST_STATE;
  gettingConnection: API_REQUEST_STATE;
  gettingConnections: API_REQUEST_STATE;
  gettingMetaConnections: API_REQUEST_STATE;
  deletingConnectionById: API_REQUEST_STATE;
  deletingTestConnectionById: API_REQUEST_STATE;
  deletingConnectionsById: API_REQUEST_STATE;
  currentConnection: IConnection;
  /*
   * TODO: rework during the the connection cleaning
   */
  currentTechnicalItem: any;
  connection: any;
  testConnection: any;
  updateConnection: any;
  notificationData: any;
  detailsLocation: string;
  colorMode: string;
  processTextSize: number;
  isCreateElementPanelOpened: boolean;
  isDraftOpenedOnce: boolean;
  currentLogs: ConnectionLogProps[];
  logMessages: any[],
  isTestingConnection: boolean;
  logPanelHeight: number;
  isDetailsOpened: boolean;
  justCreatedItem: { index: string; connectorType: string };
  justDeletedItem: { index: string; connectorType: string };
}

let initialState: ConnectionState = {
  isAnimationNotFound: false,
  animationSpeed: 1000,
  isSavePanelVisible: false,
  isTemplatePanelVisible: false,
  videoAnimationName: '',
  isAnimationPreviewPanelOpened: true,
  isButtonPanelOpened: true,
  moveTestButton: 0,
  connections: [],
  metaConnections: [],
  isCurrentConnectionHasUniqueTitle: TRIPLET_STATE.INITIAL,
  checkingConnectionTitle: API_REQUEST_STATE.INITIAL,
  testingConnection: API_REQUEST_STATE.INITIAL,
  addingConnection: API_REQUEST_STATE.INITIAL,
  addingTestConnection: API_REQUEST_STATE.INITIAL,
  updatingConnection: API_REQUEST_STATE.INITIAL,
  gettingConnection: API_REQUEST_STATE.INITIAL,
  gettingConnections: API_REQUEST_STATE.INITIAL,
  gettingMetaConnections: API_REQUEST_STATE.INITIAL,
  deletingConnectionById: API_REQUEST_STATE.INITIAL,
  deletingTestConnectionById: API_REQUEST_STATE.INITIAL,
  deletingConnectionsById: API_REQUEST_STATE.INITIAL,
  currentConnection: null,
  currentTechnicalItem: null,
  connection: null,
  testConnection: null,
  updateConnection: null,
  notificationData: {},
  detailsLocation: PANEL_LOCATION.SAME_WINDOW,
  colorMode: COLOR_MODE.RECTANGLE_TOP,
  processTextSize: 20,
  isCreateElementPanelOpened: false,
  isDraftOpenedOnce: false,
  currentLogs: [],
  logMessages: [],
  isTestingConnection: false,
  logPanelHeight: 0,
  isDetailsOpened: true,
  justCreatedItem: null,
  justDeletedItem: null,
  ...CommonState,
};

const connectionReducers = (isModal: boolean = false) => {
  const reducers: SliceCaseReducers<ConnectionState> = {
    setJustCreatedItem: (state, action: PayloadAction<any>) => {
      state.justCreatedItem = action.payload;
    },
    setJustDeletedItem: (state, action: PayloadAction<any>) => {
      state.justDeletedItem = action.payload;
    },
    toggleDetails: (state, action: PayloadAction<boolean | undefined>) => {
      state.isDetailsOpened =
        typeof action.payload === "undefined"
          ? !state.isDetailsOpened
          : action.payload;
    },
    setLogPanelHeight: (state, action: PayloadAction<number>) => {
      state.logPanelHeight = action.payload;
    },
    setButtonPanelVisibility: (state, action: PayloadAction<boolean>) => {
      state.isButtonPanelOpened = action.payload;
    },
    setSavePanelVisibility: (state, action: PayloadAction<boolean>) => {
      state.isSavePanelVisible = action.payload;
    },
    setTemplatePanelVisibility: (state, action: PayloadAction<boolean>) => {
      state.isTemplatePanelVisible = action.payload;
    },
    setAnimationPreviewPanelVisibility: (state, action: PayloadAction<boolean>) => {
      state.isAnimationPreviewPanelOpened = action.payload;
    },
    setVideoAnimationName: (state, action: PayloadAction<string>) => {
      state.videoAnimationName = action.payload;
    },
    setAnimationSpeed: (state, action: PayloadAction<number>) => {
      state.animationSpeed = action.payload;
    },
    setIsAnamationNotFoud: (state, action: PayloadAction<boolean>) => {
      state.isAnimationNotFound = action.payload;
    },
    setTestingConnection: (state, action: PayloadAction<boolean>) => {
      if (action.payload) {
        state.currentLogs = [];
        if (state.logPanelHeight === 0) {
          state.logPanelHeight = LogPanelHeight.Medium;
        }
      }

      if (!action.payload) {
        state.moveTestButton = 0;
      }

      state.isTestingConnection = action.payload;
    },
  addCurrentLog: (state, action: PayloadAction<ConnectionLogProps>) => {
      if(action.payload){
          const currentState = current(state);
          let newCurrentLogs = currentState.currentLogs;
          if(action.payload.isMethod){
              newCurrentLogs = currentState.currentLogs.map(log => {
                  if(log.index === action.payload.index && log.connectorType === action.payload.connectorType){
                      return {...log, shouldDraw: false};
                  }
                  return log;
              })
          }
          if(action.payload.isOperator){
              newCurrentLogs = currentState.currentLogs.map(log => {
                  if(log.index.indexOf(action.payload.index) === 0 && log.connectorType === action.payload.connectorType){
                      return {...log, shouldDraw: false};
                  }
                  return log;
              })
          }
          let lastLog = state.currentLogs.length > 0 ? state.currentLogs[state.currentLogs.length - 1] : null;
          let lastLogKey = lastLog ? state.currentLogs.length - 1 : -1;
          if(lastLog && lastLog.message === ConnectionLogs.BreakMessage && state.currentLogs.length > 1 && lastLog.message !== action.payload.message){
              lastLog = state.currentLogs[state.currentLogs.length - 2];
              lastLogKey = state.currentLogs.length - 2;
          }
          let index = action.payload.index ? action.payload.index : state.currentLogs.length > 0 ? state.currentLogs[state.currentLogs.length - 1].index : '';
          let connectorType = action.payload.connectorType ? action.payload.connectorType : state.currentLogs.length > 0 ? state.currentLogs[state.currentLogs.length - 1].connectorType : '';
          let operatorData = state.currentLogs.length > 0 ? currentState.currentLogs[currentState.currentLogs.length - 1].operatorData : null;
          if (action.payload.operatorData) {
              operatorData = {...operatorData, ...action.payload.operatorData};
          }
          let methodData = action.payload.methodData ? action.payload.methodData : state.currentLogs.length > 0 ? currentState.currentLogs[currentState.currentLogs.length - 1].methodData : null;
          let hasNextItem = action.payload.index ? action.payload.hasNextItem : state.currentLogs.length > 0 ? currentState.currentLogs[currentState.currentLogs.length - 1].hasNextItem : false;
          if(!lastLog || lastLog.message !== action.payload.message) {
              newCurrentLogs = [...newCurrentLogs, {
                  ...action.payload,
                  shouldDraw: true,
                  index,
                  connectorType,
                  operatorData,
                  methodData,
                  hasNextItem
              }];
          }
          if(lastLog && lastLog.message === action.payload.message){
              newCurrentLogs = newCurrentLogs.map((currentLog, key) => key === lastLogKey ? {
                  ...action.payload,
                  shouldDraw: true,
                  index,
                  connectorType,
                  operatorData,
                  methodData,
                  hasNextItem
              } : currentLog);
          }
          state.currentLogs = newCurrentLogs;
          state.logMessages = [...state.logMessages, action.payload];
      }
  },
  shouldNotDrawLogMessage: (state, action: PayloadAction<{index: string, connectorType: string}>) => {
      state.currentLogs = state.currentLogs.map(log => {
          if(log.index === action.payload.index && log.connectorType === action.payload.connectorType){
              return {...log, shouldDraw: false};
          }
          return log;
      })
  },
  addLogMessage: (state, action: PayloadAction<any>) => {
      state.logMessages = [...state.logMessages, action.payload];
  },
    clearCurrentLogs: (state, action: PayloadAction<any>) => {
      state.currentLogs = [];
    },
    setColorMode: (state, action: PayloadAction<string>) => {
      state.colorMode = action.payload;
    },
    setPanelConfigurations: (state, action: PayloadAction<any>) => {
      if (action.payload.colorMode) {
        state.colorMode = action.payload.colorMode;
      }
      if (action.payload.processTextSize) {
        state.processTextSize = action.payload.processTextSize;
      }
    },
    setConnectionData: (state, action: PayloadAction<any>) => {
      state.connection = action.payload.connection;
      if (action.payload.updateConnection) {
        state.updateConnection = action.payload.updateConnection;
      }
    },
    setCurrentTechnicalItem: (state, action: PayloadAction<any>) => {
      state.currentTechnicalItem = action.payload;
      state.isCreateElementPanelOpened = action.payload !== null;
    },
    setDetailsLocation: (state, action: PayloadAction<any>) => {
      state.detailsLocation = action.payload.location;
    },
    setConnectionDraftWasOpened: (state, action: PayloadAction<never>) => {
      state.isDraftOpenedOnce = true;
    },
    setInitialTestConnectionState: (state) => {
      state.moveTestButton = 170;
      state.testConnection = null;
      state.addingTestConnection = API_REQUEST_STATE.INITIAL;
      state.deletingTestConnectionById = API_REQUEST_STATE.INITIAL;
    }
  }
  if(!isModal){
    const extraReducers: CaseReducers<NoInfer<ConnectionState>, any>  = {
      [testConnection.pending.type]: (state) => {
        state.testingConnection = API_REQUEST_STATE.START;
      },
      [testConnection.fulfilled.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.testingConnection = API_REQUEST_STATE.FINISH;
        state.error = null;
      },
      [testConnection.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.testingConnection = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [checkConnectionTitle.pending.type]: (state) => {
        state.checkingConnectionTitle = API_REQUEST_STATE.START;
        state.isCurrentConnectionHasUniqueTitle = TRIPLET_STATE.INITIAL;
      },
      [checkConnectionTitle.fulfilled.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.checkingConnectionTitle = API_REQUEST_STATE.FINISH;
        state.isCurrentConnectionHasUniqueTitle =
          action.payload.message === ResponseMessages.NOT_EXISTS
            ? TRIPLET_STATE.TRUE
            : TRIPLET_STATE.FALSE;
        state.error = null;
      },
      [checkConnectionTitle.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.checkingConnectionTitle = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [addConnection.pending.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.addingConnection = API_REQUEST_STATE.START;
      },
      [addConnection.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.addingConnection = API_REQUEST_STATE.FINISH;
        state.connections.push(action.payload);
        state.metaConnections.push(action.payload);
        state.currentConnection = action.payload;
        state.error = null;
      },
      [addConnection.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.addingConnection = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [addTestConnection.pending.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.addingTestConnection = API_REQUEST_STATE.START;
      },
      [addTestConnection.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.addingTestConnection = API_REQUEST_STATE.FINISH;
        state.testConnection = action.payload;
        state.error = null;
      },
      [addTestConnection.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.addingTestConnection = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getAndUpdateConnection.pending.type]: (state, action: any) => {
        state.updatingConnection = API_REQUEST_STATE.START;
      },
      [getAndUpdateConnection.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.updatingConnection = API_REQUEST_STATE.FINISH;
        state.connections = state.connections.map((connection) =>
          connection.connectionId === action.payload.connectionId
            ? action.payload
            : connection
        );
        state.metaConnections = state.metaConnections.map((connection) =>
          connection.connectionId === action.payload.connectionId
            ? action.payload
            : connection
        );
        state.error = null;
      },
      [getAndUpdateConnection.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.updatingConnection = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [updateConnection.pending.type]: (state) => {
        state.updatingConnection = API_REQUEST_STATE.START;
      },
      [updateConnection.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.updatingConnection = API_REQUEST_STATE.FINISH;
        state.connections = state.connections.map((connection) =>
          connection.connectionId === action.payload.connectionId
            ? action.payload
            : connection
        );
        state.metaConnections = state.metaConnections.map((connection) =>
          connection.connectionId === action.payload.connectionId
            ? action.payload
            : connection
        );
        if (
          state.currentConnection &&
          state.currentConnection.connectionId === action.payload.connectionId
        ) {
          state.currentConnection = action.payload;
        }
        state.error = null;
      },
      [updateConnection.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.updatingConnection = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getConnectionById.pending.type]: (state) => {
        state.currentConnection = null;
        state.gettingConnection = API_REQUEST_STATE.START;
      },
      [getConnectionById.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection>
      ) => {
        state.gettingConnection = API_REQUEST_STATE.FINISH;
        state.currentConnection = action.payload;
        state.error = null;
      },
      [getConnectionById.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.gettingConnection = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getAllConnections.pending.type]: (state) => {
        state.gettingConnections = API_REQUEST_STATE.START;
      },
      [getAllConnections.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection[]>
      ) => {
        state.gettingConnections = API_REQUEST_STATE.FINISH;
        state.connections = action.payload;
        state.error = null;
      },
      [getAllConnections.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.gettingConnections = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [getAllMetaConnections.pending.type]: (state) => {
        state.gettingMetaConnections = API_REQUEST_STATE.START;
      },
      [getAllMetaConnections.fulfilled.type]: (
        state,
        action: PayloadAction<IConnection[]>
      ) => {
        state.gettingMetaConnections = API_REQUEST_STATE.FINISH;
        state.metaConnections = action.payload;
        state.error = null;
      },
      [getAllMetaConnections.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.gettingMetaConnections = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [deleteConnectionById.pending.type]: (state) => {
        state.deletingConnectionById = API_REQUEST_STATE.START;
      },
      [deleteConnectionById.fulfilled.type]: (
        state,
        action: PayloadAction<number>
      ) => {
        state.deletingConnectionById = API_REQUEST_STATE.FINISH;
        state.connections = state.connections.filter(
          (connection) => connection.connectionId !== action.payload
        );
        state.metaConnections = state.metaConnections.filter(
          (connection) => connection.connectionId !== action.payload
        );
        if (
          state.currentConnection &&
          state.currentConnection.connectionId === action.payload
        ) {
          state.currentConnection = null;
        }
        state.error = null;
      },
      [deleteConnectionById.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.deletingConnectionById = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [deleteTestConnectionById.pending.type]: (state) => {
        state.deletingTestConnectionById = API_REQUEST_STATE.START;
      },
      [deleteTestConnectionById.fulfilled.type]: (
        state,
        action: PayloadAction<number>
      ) => {
        state.deletingTestConnectionById = API_REQUEST_STATE.FINISH;
        if (
          state.testConnection &&
          state.testConnection.connectionId === action.payload
        ) {
          state.testConnection = null;
        }
        state.error = null;
      },
      [deleteTestConnectionById.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.deletingTestConnectionById = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      },
      [deleteConnectionsById.pending.type]: (state) => {
        state.deletingConnectionsById = API_REQUEST_STATE.START;
      },
      [deleteConnectionsById.fulfilled.type]: (
        state,
        action: PayloadAction<number[]>
      ) => {
        state.deletingConnectionsById = API_REQUEST_STATE.FINISH;
        state.connections = state.connections.filter(
          (connection) =>
            action.payload.findIndex(
              (id) => `${id}` === `${connection.connectionId}`
            ) === -1
        );
        state.metaConnections = state.metaConnections.filter(
          (connection) =>
            action.payload.findIndex(
              (id) => `${id}` === `${connection.connectionId}`
            ) === -1
        );
        if (
          state.currentConnection &&
          action.payload.findIndex(
            (id) => `${id}` === `${state.currentConnection.connectionId}`
          ) !== -1
        ) {
          state.currentConnection = null;
        }
        state.error = null;
      },
      [deleteConnectionsById.rejected.type]: (
        state,
        action: PayloadAction<IResponse>
      ) => {
        state.deletingConnectionsById = API_REQUEST_STATE.ERROR;
        state.error = action.payload;
      }
    }
    return {reducers, extraReducers}
  }

  return {reducers}
}

export const connectionSlice = createSlice({
  name: "connection",
  initialState,
  ...connectionReducers()
});


export const {
  addCurrentLog,
  shouldNotDrawLogMessage,
  addLogMessage,
  clearCurrentLogs,
  setTestingConnection,
  setColorMode,
  setPanelConfigurations,
  setConnectionData,
  setCurrentTechnicalItem,
  setDetailsLocation,
  setConnectionDraftWasOpened,
  setInitialTestConnectionState,
  setLogPanelHeight,
  toggleDetails,
  setJustCreatedItem,
  setJustDeletedItem,
  setButtonPanelVisibility,
  setAnimationPreviewPanelVisibility,
  setVideoAnimationName,
  setSavePanelVisibility,
  setTemplatePanelVisibility,
  setAnimationSpeed,
  setIsAnamationNotFoud
} = connectionSlice.actions;


export const actions = {
  setInitialTestConnectionState,
};

export default connectionSlice.reducer;
