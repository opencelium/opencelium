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
