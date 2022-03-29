import {createAsyncThunk} from "@reduxjs/toolkit";
import {ScheduleRequest} from "@request/schedule/Schedule";
import { ISchedule } from "@interface/schedule/ISchedule";
import {
    SchedulesIdRequestProps,
} from "@requestInterface/schedule/ISchedule";
import {errorHandler} from "../../../components/utils";

export const checkScheduleTitle = createAsyncThunk(
    'schedule/exist/title',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/exists/${schedule.title}`});
            const response = await request.checkScheduleTitle();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const switchScheduleStatus = createAsyncThunk(
    'schedule/switch/status',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/${schedule.id}/status`});
            await request.switchScheduleStatus({status: schedule.status});
            return schedule;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const startSchedule = createAsyncThunk(
    'schedule/start',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/execute/${schedule.id}`});
            await request.startSchedule();
            return schedule;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const startSchedules = createAsyncThunk(
    'schedule/start/selected',
    async(data: SchedulesIdRequestProps, thunkAPI) => {
        try {
            const request = new ScheduleRequest();
            await request.startSchedules(data);
            return data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const enableSchedules = createAsyncThunk(
    'schedule/enable/selected',
    async(data: SchedulesIdRequestProps, thunkAPI) => {
        try {
            const request = new ScheduleRequest();
            await request.enableSchedules(data);
            return data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const disableSchedules = createAsyncThunk(
    'schedule/disable/selected',
    async(data: SchedulesIdRequestProps, thunkAPI) => {
        try {
            const request = new ScheduleRequest();
            await request.disableSchedules(data);
            return data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getScheduleById = createAsyncThunk(
    'schedule/get/byId',
    async(scheduleId: number, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/${scheduleId}`});
            const response = await request.getScheduleById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getSchedulesById = createAsyncThunk(
    'schedule/get/selected',
    async(data: SchedulesIdRequestProps, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/ids`});
            const response = await request.getSchedulesById(data);
            // @ts-ignore
            return response.data._embedded?.schedulerResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllSchedules = createAsyncThunk(
    'schedule/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/all`});
            const response = await request.getAllSchedules();
            // @ts-ignore
            return response.data._embedded?.schedulerResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getCurrentSchedules = createAsyncThunk(
    'schedule/get/current',
    async(data: never, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/running/all`});
            const response = await request.getCurrentSchedules();
            // @ts-ignore
            return response.data._embedded?.runningJobsResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addSchedule = createAsyncThunk(
    'schedule/add',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            /*
            * TODO: uncomment when backend has check title method
            */
            /*const checkTitleRequest = new ScheduleRequest({endpoint: `/exists/${schedule.title}`});
            const responseTitleRequest = await checkTitleRequest.checkScheduleTitle();
            if(responseTitleRequest.data.message === ResponseMessages.EXISTS){
                return thunkAPI.rejectWithValue(responseTitleRequest.data);
            }*/
            const addScheduleRequest = new ScheduleRequest();
            const response = await addScheduleRequest.addSchedule(schedule);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateSchedule = createAsyncThunk(
    'schedule/update',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            /*
            * TODO: uncomment when backend has check title method
            */
            /*
            // @ts-ignore
            const scheduleState = thunkAPI.getState().scheduleReducer;
            if(scheduleState.currentSchedule.title !== schedule.title){
                const checkTitleRequest = new ScheduleRequest({endpoint: `/exists/${schedule.title}`});
                const responseTitleRequest = await checkTitleRequest.checkScheduleTitle();
                if(responseTitleRequest.data.message === ResponseMessages.EXISTS){
                    return thunkAPI.rejectWithValue(responseTitleRequest.data);
                }
            }*/
            const updateScheduleRequest = new ScheduleRequest({endpoint: `/${schedule.id}`});
            const response = await updateScheduleRequest.updateSchedule(schedule);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteScheduleById = createAsyncThunk(
    'schedule/delete/byId',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            const request = new ScheduleRequest({endpoint: `/${schedule.id}`});
            await request.deleteScheduleById();
            return schedule;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteSchedulesById = createAsyncThunk(
    'schedule/delete/selected/byId',
    async(scheduleIds: number[], thunkAPI) => {
        try {
            const request = new ScheduleRequest();
            await request.deleteSchedulesById(scheduleIds);
            return scheduleIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkScheduleTitle,
    switchScheduleStatus,
    startSchedule,
    startSchedules,
    enableSchedules,
    disableSchedules,
    getScheduleById,
    getSchedulesById,
    getAllSchedules,
    getCurrentSchedules,
    addSchedule,
    updateSchedule,
    deleteScheduleById,
    deleteSchedulesById,
}