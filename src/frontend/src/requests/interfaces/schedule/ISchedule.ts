import {AxiosResponse} from "axios";
import { ISchedule } from "@interface/schedule/ISchedule";
import {IResponse} from "../application/IResponse";


export interface ScheduleStatusRequestProps{
    status: number,
}

export interface SchedulesIdRequestProps{
    schedulerIds: number[],
}

export interface IScheduleRequest{

    /*
    * TODO: do not exist such method on the server
    */
    //to check if schedule with such title already exists
    checkScheduleTitle(): Promise<AxiosResponse<IResponse>>,

    //to switch schedule status
    switchScheduleStatus(data: ScheduleStatusRequestProps): Promise<AxiosResponse<IResponse>>,

    //to start schedule
    startSchedule(): Promise<AxiosResponse<IResponse>>,

    //to start schedules by id
    startSchedules(data: SchedulesIdRequestProps): Promise<AxiosResponse<IResponse>>,

    //to enable schedules by id
    enableSchedules(data: SchedulesIdRequestProps): Promise<AxiosResponse<IResponse>>,

    //to disabled schedules by id
    disableSchedules(data: SchedulesIdRequestProps): Promise<AxiosResponse<IResponse>>,

    //to get schedule by id
    getScheduleById(): Promise<AxiosResponse<ISchedule>>,

    //to get schedules by id
    getSchedulesById(data: SchedulesIdRequestProps): Promise<AxiosResponse<ISchedule[]>>,

    //to get all schedules of authorized user
    getAllSchedules(): Promise<AxiosResponse<ISchedule[]>>,

    //to get schedules of authorized user that currently working on
    getCurrentSchedules(): Promise<AxiosResponse<ISchedule[]>>,

    //to add schedule
    addSchedule(notificationTemplate: ISchedule): Promise<AxiosResponse<ISchedule>>,

    //to update schedule
    updateSchedule(notificationTemplate: ISchedule): Promise<AxiosResponse<ISchedule>>,

    //to delete schedule by id
    deleteScheduleById(): Promise<AxiosResponse<ISchedule>>,

    //to delete schedules by id
    deleteSchedulesById(notificationTemplate: number[]): Promise<AxiosResponse<number[]>>,
}