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

import {createSlice, PayloadAction, current} from "@reduxjs/toolkit";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import {SchedulesIdRequestProps} from "../../requests/interfaces/ISchedule";
import {
    addSchedule,
    checkScheduleTitle,
    deleteScheduleById,
    deleteSchedulesById, disableSchedules, enableSchedules,
    getAllSchedules, getCurrentSchedules,
    getScheduleById, getSchedulesById, startSchedule, startSchedules, switchScheduleStatus,
    updateSchedule,
} from "../action_creators/ScheduleCreators";
import {deleteWebhook, getWebhook} from "../action_creators/WebhookCreators";
import ModelCurrentSchedule from "../../requests/models/CurrentSchedule";
import ModelSchedule from "../../requests/models/Schedule";

export interface ScheduleState extends ICommonState{
    schedules: ModelSchedule[],
    currentSchedules: ModelCurrentSchedule[],
    isCurrentScheduleHasUniqueTitle: TRIPLET_STATE,
    checkingScheduleTitle: API_REQUEST_STATE,
    switchingScheduleStatus: API_REQUEST_STATE,
    startingSchedule: API_REQUEST_STATE,
    startingSchedules: API_REQUEST_STATE,
    enablingSchedules: API_REQUEST_STATE,
    disablingSchedules: API_REQUEST_STATE,
    addingSchedule: API_REQUEST_STATE,
    updatingSchedule: API_REQUEST_STATE,
    gettingScheduleById: API_REQUEST_STATE,
    gettingSchedulesById: API_REQUEST_STATE,
    gettingCurrentSchedules: API_REQUEST_STATE,
    gettingAllSchedules: API_REQUEST_STATE,
    deletingScheduleById: API_REQUEST_STATE,
    deletingSchedulesById: API_REQUEST_STATE,
    gettingWebhook: API_REQUEST_STATE,
    deletingWebhook: API_REQUEST_STATE,
    currentSchedule: ModelSchedule,
}

const initialState: ScheduleState = {
    schedules: [],
    currentSchedules: [],
    isCurrentScheduleHasUniqueTitle: TRIPLET_STATE.INITIAL,
    checkingScheduleTitle: API_REQUEST_STATE.INITIAL,
    switchingScheduleStatus: API_REQUEST_STATE.INITIAL,
    startingSchedule: API_REQUEST_STATE.INITIAL,
    startingSchedules: API_REQUEST_STATE.INITIAL,
    enablingSchedules: API_REQUEST_STATE.INITIAL,
    disablingSchedules: API_REQUEST_STATE.INITIAL,
    addingSchedule: API_REQUEST_STATE.INITIAL,
    updatingSchedule: API_REQUEST_STATE.INITIAL,
    gettingScheduleById: API_REQUEST_STATE.INITIAL,
    gettingSchedulesById: API_REQUEST_STATE.INITIAL,
    gettingCurrentSchedules: API_REQUEST_STATE.INITIAL,
    gettingAllSchedules: API_REQUEST_STATE.INITIAL,
    deletingScheduleById: API_REQUEST_STATE.INITIAL,
    deletingSchedulesById: API_REQUEST_STATE.INITIAL,
    gettingWebhook: API_REQUEST_STATE.INITIAL,
    deletingWebhook: API_REQUEST_STATE.INITIAL,
    currentSchedule: null,
    ...CommonState,
}

export const scheduleSlice = createSlice({
    name: 'schedule',
    initialState,
    reducers: {
        copyWebhookToClipboard: (state) => {
        },
        setCurrentSchedule: (state, action) => {
            state.currentSchedule = action.payload;
        }
    },
    extraReducers: {
        [checkScheduleTitle.pending.type]: (state) => {
            state.checkingScheduleTitle = API_REQUEST_STATE.START;
        },
        [checkScheduleTitle.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingScheduleTitle = API_REQUEST_STATE.FINISH;
            state.isCurrentScheduleHasUniqueTitle = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkScheduleTitle.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingScheduleTitle = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [switchScheduleStatus.pending.type]: (state) => {
            state.switchingScheduleStatus = API_REQUEST_STATE.START;
        },
        [switchScheduleStatus.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.switchingScheduleStatus = API_REQUEST_STATE.FINISH;
            let index = state.schedules.findIndex(schedule => schedule.schedulerId === action.payload.schedulerId);
            if(index !== -1){
                state.schedules[index] = action.payload;
            }
            state.error = null;
        },
        [switchScheduleStatus.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.switchingScheduleStatus = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [startSchedule.pending.type]: (state) => {
            state.startingSchedule = API_REQUEST_STATE.START;
        },
        [startSchedule.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.startingSchedule = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [startSchedule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.startingSchedule = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [startSchedules.pending.type]: (state) => {
            state.startingSchedules = API_REQUEST_STATE.START;
        },
        [startSchedules.fulfilled.type]: (state, action: PayloadAction<SchedulesIdRequestProps>) => {
            state.startingSchedules = API_REQUEST_STATE.FINISH;
            state.error = null;
        },
        [startSchedules.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.startingSchedules = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [enableSchedules.pending.type]: (state) => {
            state.enablingSchedules = API_REQUEST_STATE.START;
        },
        [enableSchedules.fulfilled.type]: (state, action: PayloadAction<SchedulesIdRequestProps>) => {
            state.enablingSchedules = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.map(schedule => action.payload.schedulerIds.findIndex(id => id === schedule.schedulerId) !== -1 ? {...schedule, status: 1} : schedule);
            if(state.currentSchedule && action.payload.schedulerIds.findIndex(id => id === state.currentSchedule.schedulerId) !== -1){
                state.currentSchedule = {...state.currentSchedule, status: 1};
            }
            state.error = null;
        },
        [enableSchedules.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.enablingSchedules = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [disableSchedules.pending.type]: (state) => {
            state.disablingSchedules = API_REQUEST_STATE.START;
        },
        [disableSchedules.fulfilled.type]: (state, action: PayloadAction<SchedulesIdRequestProps>) => {
            state.disablingSchedules = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.map(schedule => action.payload.schedulerIds.findIndex(id => id === schedule.schedulerId) !== -1 ? {...schedule, status: 0} : schedule);
            if(state.currentSchedule && action.payload.schedulerIds.findIndex(id => id === state.currentSchedule.schedulerId) !== -1){
                state.currentSchedule = {...state.currentSchedule, status: 0};
            }
            state.error = null;
        },
        [disableSchedules.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.disablingSchedules = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addSchedule.pending.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.addingSchedule = API_REQUEST_STATE.START;
        },
        [addSchedule.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.addingSchedule = API_REQUEST_STATE.FINISH;
            state.schedules.push(action.payload);
            state.error = null;
        },
        [addSchedule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingSchedule = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentScheduleHasUniqueTitle = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [updateSchedule.pending.type]: (state) => {
            state.updatingSchedule = API_REQUEST_STATE.START;
        },
        [updateSchedule.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.updatingSchedule = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.map(schedule => schedule.schedulerId === action.payload.schedulerId ? action.payload : schedule);
            state.error = null;
        },
        [updateSchedule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingSchedule = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentScheduleHasUniqueTitle = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [getScheduleById.pending.type]: (state) => {
            state.gettingScheduleById = API_REQUEST_STATE.START;
            state.currentSchedule = null;
        },
        [getScheduleById.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.gettingScheduleById = API_REQUEST_STATE.FINISH;
            state.currentSchedule = action.payload;
            state.error = null;
        },
        [getScheduleById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingScheduleById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getSchedulesById.pending.type]: (state) => {
            state.gettingSchedulesById = API_REQUEST_STATE.START;
        },
        [getSchedulesById.fulfilled.type]: (state, action: PayloadAction<ModelSchedule[]>) => {
            state.gettingSchedulesById = API_REQUEST_STATE.FINISH;
            if(state.schedules.length === 0){
                state.schedules = action.payload;
            } else{
                state.schedules = current(state.schedules).map(schedule => {
                    let index = action.payload.findIndex(newSchedule => schedule.schedulerId ? newSchedule.schedulerId === schedule.schedulerId : newSchedule.schedulerId === schedule.schedulerId);
                    if(index === -1){
                        return schedule;
                    } else{
                        return action.payload[index];
                    }
                });
            }
            state.error = null;
        },
        [getSchedulesById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingSchedulesById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getCurrentSchedules.pending.type]: (state) => {
            state.gettingCurrentSchedules = API_REQUEST_STATE.START;
        },
        [getCurrentSchedules.fulfilled.type]: (state, action: PayloadAction<ModelCurrentSchedule[]>) => {
            state.gettingCurrentSchedules = API_REQUEST_STATE.FINISH;
            state.currentSchedules = action.payload;
            state.error = null;
        },
        [getCurrentSchedules.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingCurrentSchedules = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllSchedules.pending.type]: (state) => {
            state.gettingAllSchedules = API_REQUEST_STATE.START;
        },
        [getAllSchedules.fulfilled.type]: (state, action: PayloadAction<ModelSchedule[]>) => {
            state.gettingAllSchedules = API_REQUEST_STATE.FINISH;
            state.schedules = action.payload;
            state.error = null;
        },
        [getAllSchedules.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllSchedules = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteScheduleById.pending.type]: (state) => {
            state.deletingScheduleById = API_REQUEST_STATE.START;
        },
        [deleteScheduleById.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingScheduleById = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.filter(schedule => schedule.schedulerId !== action.payload);
            if(state.currentSchedule && state.currentSchedule.schedulerId === action.payload){
                state.currentSchedule = null;
            }
            state.error = null;
        },
        [deleteScheduleById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingScheduleById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteSchedulesById.pending.type]: (state) => {
            state.deletingSchedulesById = API_REQUEST_STATE.START;
        },
        [deleteSchedulesById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingSchedulesById = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.filter(schedule => action.payload.findIndex(id => `${id}` === `${schedule.schedulerId}`) === -1);
            if(state.currentSchedule && action.payload.findIndex(id => `${id}` === `${state.currentSchedule.schedulerId}`) !== -1){
                state.currentSchedule = null;
            }
            state.error = null;
        },
        [deleteSchedulesById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingSchedulesById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getWebhook.pending.type]: (state) => {
            state.gettingWebhook = API_REQUEST_STATE.START;
        },
        [getWebhook.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.gettingWebhook = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.map(schedule => schedule.schedulerId === action.payload.schedulerId ? {...schedule, webhook: action.payload.webhook} : schedule);
            state.error = null;
        },
        [getWebhook.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingWebhook = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteWebhook.pending.type]: (state) => {
            state.deletingWebhook = API_REQUEST_STATE.START;
        },
        [deleteWebhook.fulfilled.type]: (state, action: PayloadAction<ModelSchedule>) => {
            state.deletingWebhook = API_REQUEST_STATE.FINISH;
            state.schedules = state.schedules.map(schedule => schedule.schedulerId === action.payload.schedulerId ? {...schedule, webhook: null} : schedule);
            state.error = null;
        },
        [deleteWebhook.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingWebhook = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    copyWebhookToClipboard, setCurrentSchedule,
} = scheduleSlice.actions;

export const actions = {
    copyWebhookToClipboard,
}

export default scheduleSlice.reducer;