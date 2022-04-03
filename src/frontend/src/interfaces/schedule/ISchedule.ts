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

import {IForm} from "@interface/application/core";
import {OptionProps} from "@atom/input/select/interfaces";
import {ScheduleState} from "@slice/schedule/ScheduleSlice";
import {IWebhook} from "./IWebhook";
import {IConnection} from "@interface/connection/IConnection";
import React from "react";



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
}
