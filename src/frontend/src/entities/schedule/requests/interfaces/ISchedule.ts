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

import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import ModelSchedule from "../models/Schedule";
import ModelCurrentSchedule from "../models/CurrentSchedule";
import ModelScheduleHateoas from "../models/ScheduleHateoas";


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
    getScheduleById(): Promise<AxiosResponse<ModelSchedule>>,

    //to get schedules by id
    getSchedulesById(data: SchedulesIdRequestProps): Promise<AxiosResponse<ModelSchedule[]>>,

    //to get all schedules of authorized user
    getAllSchedules(): Promise<AxiosResponse<ModelScheduleHateoas | null>>,

    //to get schedules of authorized user that currently working on
    getCurrentSchedules(): Promise<AxiosResponse<ModelCurrentSchedule[]>>,

    //to add schedule
    addSchedule(schedule: ModelSchedule): Promise<AxiosResponse<ModelSchedule>>,

    //to update schedule
    updateSchedule(schedule: ModelSchedule): Promise<AxiosResponse<ModelSchedule>>,

    //to delete schedule by id
    deleteScheduleById(): Promise<AxiosResponse<ModelSchedule>>,

    //to delete schedules by id
    deleteSchedulesById(scheduleIds: number[]): Promise<AxiosResponse<number[]>>,
}