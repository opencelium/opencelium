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

import { createSlice, PayloadAction, current } from "@reduxjs/toolkit";
import { CommonState } from "@application/utils/store";
import { ICommonState } from "@application/interfaces/core";
import { ConnectionLogProps } from "../../interfaces/IConnection";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import {COLOR_MODE} from "@classes/content/connection_overview_2/CSvg";
import { LogPanelHeight } from "./ConnectionSlice";

export interface ConnectionState extends ICommonState {
  isAnimationPaused: boolean;
  testConnection: any;
  currentTechnicalItem: any;
  isCreateElementPanelOpened: boolean;
  connection: any;
  updateConnection: any;
  colorMode: string;
  processTextSize: number;
  moveTestButton: number;
  isTestingConnection: boolean;
  currentLogs: ConnectionLogProps[];
  logPanelHeight: number;
  isDetailsOpened: boolean;
  justCreatedItem: { index: string; connectorType: string };
  justDeletedItem: { index: string; connectorType: string };
}

let initialState: ConnectionState = {
  isAnimationPaused: false,
  moveTestButton: 0,
  currentTechnicalItem: null,
  connection: null,
  testConnection: null,
  updateConnection: null,
  colorMode: COLOR_MODE.RECTANGLE_TOP,
  processTextSize: 20,
  isCreateElementPanelOpened: false,
  currentLogs: [],
  isTestingConnection: false,
  logPanelHeight: 0,
  isDetailsOpened: true,
  justCreatedItem: null,
  justDeletedItem: null,
  ...CommonState,
};

export const modalConnectionSlice = createSlice({
  name: "modal_connection",
  initialState,
  reducers: {
    setAnimationPaused: (state, action: PayloadAction<boolean>) => {
      state.isAnimationPaused = action.payload;
    },
    setModalJustCreatedItem: (state, action: PayloadAction<any>) => {
      state.justCreatedItem = action.payload;
    },
    setModalJustDeletedItem: (state, action: PayloadAction<any>) => {
      state.justDeletedItem = action.payload;
    },
    toggleModalDetails: (state, action: PayloadAction<boolean | undefined>) => {
      state.isDetailsOpened =
          typeof action.payload === "undefined"
              ? !state.isDetailsOpened
              : action.payload;
    },
    setModalLogPanelHeight: (state, action: PayloadAction<number>) => {
      state.logPanelHeight = action.payload;
    },
    setModalTestingConnection: (state, action: PayloadAction<boolean>) => {
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
    addModalCurrentLog: (state, action: PayloadAction<ConnectionLogProps>) => {
      if (action.payload) {
        const currentState = current(state);
        let lastLog =
            state.currentLogs.length > 0
                ? state.currentLogs[state.currentLogs.length - 1]
                : null;
        let lastLogKey = lastLog ? state.currentLogs.length - 1 : -1;
        if (
            lastLog &&
            lastLog.message === ConnectionLogs.BreakMessage &&
            state.currentLogs.length > 1 &&
            lastLog.message !== action.payload.message
        ) {
          lastLog = state.currentLogs[state.currentLogs.length - 2];
          lastLogKey = state.currentLogs.length - 2;
        }
        let index = action.payload.index
            ? action.payload.index
            : state.currentLogs.length > 0
                ? state.currentLogs[state.currentLogs.length - 1].index
                : "";
        let connectorType = action.payload.connectorType
            ? action.payload.connectorType
            : state.currentLogs.length > 0
                ? state.currentLogs[state.currentLogs.length - 1].connectorType
                : "";
        let operatorData =
            state.currentLogs.length > 0
                ? currentState.currentLogs[currentState.currentLogs.length - 1]
                    .operatorData
                : null;
        if (action.payload.operatorData) {
          operatorData = { ...operatorData, ...action.payload.operatorData };
        }
        let methodData = action.payload.methodData
            ? action.payload.methodData
            : state.currentLogs.length > 0
                ? currentState.currentLogs[currentState.currentLogs.length - 1]
                    .methodData
                : null;
        let hasNextItem = action.payload.index
            ? action.payload.hasNextItem
            : state.currentLogs.length > 0
                ? currentState.currentLogs[currentState.currentLogs.length - 1]
                    .hasNextItem
                : false;

        if (!lastLog || lastLog.message !== action.payload.message) {
          state.currentLogs = [
            ...state.currentLogs,
            {
              ...action.payload,
              index,
              connectorType,
              operatorData,
              methodData,
              hasNextItem,
            },
          ];
        }
        if (lastLog && lastLog.message === action.payload.message) {
          state.currentLogs = state.currentLogs.map((currentLog, key) =>
              key === lastLogKey
                  ? {
                    ...action.payload,
                    index,
                    connectorType,
                    operatorData,
                    methodData,
                    hasNextItem,
                  }
                  : currentLog
          );
        }
      }
    },
    clearModalCurrentLogs: (state, action: PayloadAction<any>) => {
      state.currentLogs = [];
    },
    setModalColorMode: (state, action: PayloadAction<string>) => {
      state.colorMode = action.payload;
    },
    setModalPanelConfigurations: (state, action: PayloadAction<any>) => {
      if (action.payload.colorMode) {
        state.colorMode = action.payload.colorMode;
      }
      if (action.payload.processTextSize) {
        state.processTextSize = action.payload.processTextSize;
      }
    },
    setModalConnectionData: (state, action: PayloadAction<any>) => {
      state.connection = action.payload.connection;
      if (action.payload.updateConnection) {
        state.updateConnection = action.payload.updateConnection;
      }
    },
    setModalCurrentTechnicalItem: (state, action: PayloadAction<any>) => {
      state.currentTechnicalItem = action.payload;
      state.isCreateElementPanelOpened = action.payload !== null;
    },
    setModalInitialTestConnectionState: (state) => {
      state.moveTestButton = 170;
      state.testConnection = null;
    }
  }
});


export const {
    setModalColorMode,
    setModalPanelConfigurations,
    setModalConnectionData,
    setModalCurrentTechnicalItem,
    setModalInitialTestConnectionState,
    toggleModalDetails,
    clearModalCurrentLogs,
    addModalCurrentLog,
    setModalJustCreatedItem,
    setModalJustDeletedItem,
    setModalTestingConnection,
    setAnimationPaused,
} = modalConnectionSlice.actions;


export default modalConnectionSlice.reducer;
