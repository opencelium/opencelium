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

import React from "react";
import {IForm} from "@application/interfaces/core";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {IConnection} from "@entity/connection/interfaces/IConnection";
import {ScheduleState} from "../redux_toolkit/slices/ScheduleSlice";
import ModelSchedule from "../requests/models/Schedule";
import {IWebhook} from "./IWebhook";



export interface IScheduleTextarea{
    connectionDescription: string;
}

export interface IScheduleSelect{
    connectionSelect: OptionProps;
}

export interface IScheduleText{
    title: string;
    cronExp: string;
}

export interface IScheduleSwitch{
    debugMode: boolean;
}

export interface IExecutionState{
    duration: number,
    endTime: number,
    startTime: number,
    taId: string,
}

export interface ILastExecution{
    lastExecutionId: number,
    fail: IExecutionState,
    success: IExecutionState,
}


export interface IScheduleForm extends IScheduleText, IScheduleTextarea, IScheduleSelect, IScheduleSwitch, IForm<IScheduleText, IScheduleSelect, {}, {}, IScheduleTextarea, IScheduleSwitch>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    checkTitle: () => boolean;
    getCronExp: () => React.ReactElement;
    reduxState?: ScheduleState;
}

export interface ISchedule extends IScheduleForm{
    id?: number;
    schedulerId?: number;
    status: number;
    webhook: IWebhook;
    lastExecution?: ILastExecution,
    connection: IConnection,
    getModel?: (isForApiRequest?: boolean) => ModelSchedule,
}

export type ScheduleProps = keyof ISchedule | string;