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

import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {ISchedule} from "@interface/schedule/ISchedule";
import {
    IScheduleRequest,
    ScheduleStatusRequestProps,
    SchedulesIdRequestProps
} from "../../interfaces/schedule/ISchedule";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


export class ScheduleRequest extends Request implements IScheduleRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'scheduler', ...settings});
    }

    async checkScheduleTitle(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async switchScheduleStatus(data: ScheduleStatusRequestProps): Promise<AxiosResponse<IResponse>>{
        return super.put<IResponse>(data);
    }

    async startSchedule(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async startSchedules(data: SchedulesIdRequestProps): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/startAll';
        return super.put<IResponse>(data);
    }

    async enableSchedules(data: SchedulesIdRequestProps): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/enableAll';
        return super.put<IResponse>(data);
    }

    async disableSchedules(data: SchedulesIdRequestProps): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/disableAll';
        return super.put<IResponse>(data);
    }

    async getScheduleById(): Promise<AxiosResponse<ISchedule>>{
        return super.get<ISchedule>();
    }

    async getSchedulesById(data: SchedulesIdRequestProps): Promise<AxiosResponse<ISchedule[]>>{
        return super.post<ISchedule[]>(data);
    }

    async getAllSchedules(): Promise<AxiosResponse<ISchedule[]>>{
        return super.get<ISchedule[]>();
    }

    async getCurrentSchedules(): Promise<AxiosResponse<ISchedule[]>>{
        return super.get<ISchedule[]>();
    }

    async addSchedule(schedule: ISchedule): Promise<AxiosResponse<ISchedule>>{
        return super.post<ISchedule>(this.backendMap(schedule));
    }

    async updateSchedule(schedule: ISchedule): Promise<AxiosResponse<ISchedule>>{
        return super.put<ISchedule>(this.backendMap(schedule));
    }

    async deleteScheduleById(): Promise<AxiosResponse<ISchedule>>{
        return super.delete<ISchedule>();
    }

    async deleteSchedulesById(scheduleIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: scheduleIds});
    }

    backendMap(schedule: ISchedule){
        let mappedSchedule = {
            title: schedule.title,
            debugMode: schedule.debugMode,
            connectionId: schedule.connectionSelect.value,
            cronExp: schedule.cronExp,
        };
        if(schedule.id !== 0){
            return {
                schedulerId: schedule.id,
                ...mappedSchedule,
            }
        }
        return mappedSchedule;
    }
}