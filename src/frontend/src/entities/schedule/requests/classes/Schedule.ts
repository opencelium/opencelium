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

import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {
    IScheduleRequest,
    ScheduleStatusRequestProps,
    SchedulesIdRequestProps
} from "../interfaces/ISchedule";
import ModelSchedule from "../models/Schedule";
import ModelCurrentSchedule from "../models/CurrentSchedule";
import ModelScheduleHateoas from "../models/ScheduleHateoas";


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

    async getScheduleById(): Promise<AxiosResponse<ModelSchedule>>{
        return super.get<ModelSchedule>();
    }

    async getSchedulesById(data: SchedulesIdRequestProps): Promise<AxiosResponse<ModelSchedule[]>>{
        return super.post<ModelSchedule[]>(data);
    }

    async getAllSchedules(): Promise<AxiosResponse<ModelSchedule[] | null>>{
        return super.get<ModelSchedule[] | null>();
    }

    async getCurrentSchedules(): Promise<AxiosResponse<ModelCurrentSchedule[]>>{
        return super.get<ModelCurrentSchedule[]>();
    }

    async addSchedule(schedule: ModelSchedule): Promise<AxiosResponse<ModelSchedule>>{
        return super.post<ModelSchedule>(schedule);
    }

    async updateSchedule(schedule: ModelSchedule): Promise<AxiosResponse<ModelSchedule>>{
        return super.put<ModelSchedule>(schedule);
    }

    async deleteScheduleById(): Promise<AxiosResponse<ModelSchedule>>{
        return super.delete<ModelSchedule>();
    }

    async deleteSchedulesById(scheduleIds: number[]): Promise<AxiosResponse<number[]>>{
        this.endpoint = '/list/delete';
        return super.put<number[]>({data: scheduleIds});
    }
}