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

import React, {ReactElement, ReactNode} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@app_component/base/input/select/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {InputSwitchProps} from "@app_component/base/input/switch/interfaces";
import {IConnection} from "@entity/connection/interfaces/IConnection";
import {
    ILastExecution,
    ISchedule,
    IScheduleSelect, IScheduleSwitch,
    IScheduleText,
    IScheduleTextarea
} from "../interfaces/ISchedule";
import {ScheduleState} from "../redux_toolkit/slices/ScheduleSlice";
import {
    addSchedule, checkScheduleTitle, deleteScheduleById,
    getScheduleById, updateSchedule,
} from "../redux_toolkit/action_creators/ScheduleCreators";
import {IWebhook} from "../interfaces/IWebhook";
import ModelSchedule from "../requests/models/Schedule";
import InputCronExp from "../components/cron_exp/InputCronExp";


export class Schedule extends HookStateClass implements ISchedule{
    id: number;
    status: number;
    webhook: IWebhook;

    static reduxState?: ScheduleState;

    @App.inputType
    title: string = '';

    @App.inputType
    cronExp: string = '';

    lastExecution: ILastExecution = null;

    @App.inputType
    connectionSelect: OptionProps;

    @App.inputType
    debugMode: boolean = false;

    connectionDescription: string;

    connection: IConnection = null;

    constructor(schedule?: Partial<ISchedule> | null) {
        // @ts-ignore
        super(schedule?.validations || {}, schedule?._readOnly, schedule?.wholeInstance);
        this.id = schedule?.id || schedule?.schedulerId || 0;
        this.status = schedule?.status || 0;
        this.webhook = schedule?.webhook || null;
        this.title = schedule?.title || '';
        this.connectionSelect = schedule?.connectionSelect || null;
        this.connection = schedule?.connection || null;
        if(!this.connectionSelect && this.connection){
            this.connectionSelect = {
                label: this.connection.title,
                value: this.connection.connectionId,
                data: this.connection.description,
            };
        }
        this.connectionDescription = this.connectionSelect && this.connectionSelect.hasOwnProperty('data') ? this.connectionSelect.data : 'Here you will see the description of the connection';
        this.debugMode = schedule?.debugMode || false;
        this.cronExp = schedule?.cronExp || '';
        this.lastExecution = schedule?.lastExecution || null;
        // @ts-ignore
        this.dispatch = schedule.dispatch ? schedule.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<ISchedule>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}];
        return super.createState<ISchedule>(
            Schedule,
            (state: RootState) => state.scheduleReducer,
            args,
            observations);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.scheduleReducer);
    }

    getText(data: IInput<IScheduleText, InputTextProps>):ReactElement{
        return super.getInputText<IScheduleText, InputTextProps>(data);
    }

    getTexts(data: IInput<IScheduleText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IScheduleText, InputTextProps>(data);
    }

    getSelect(data: IInput<IScheduleSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<IScheduleSelect, InputSelectProps>(data);
    }

    getTextarea(data: IInput<IScheduleTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IScheduleTextarea, InputTextareaProps>(data);
    }

    getSwitch(data: IInput<IScheduleSwitch, InputSwitchProps>): ReactElement {
        return super.getInputSwitch<IScheduleSwitch, InputSwitchProps>(data);
    }

    getCronExp(){
        let propertyName = 'cronExp';
        const updateFunctionName = this.getFunctionName(propertyName);
        // @ts-ignore
        const validationMessage = this.validations[propertyName] || '';
        return <InputCronExp
            icon={'schedule'}
            label={'Cron Expression'}
            id={`input_${propertyName.toString()}`}
            key={propertyName.toString()}
            readOnly={this._readOnly}
            // @ts-ignore
            onChange={(value: any) => this[updateFunctionName](this, value)}
            // @ts-ignore
            value={this[propertyName]}
            error={validationMessage}
        />;
    }

    validateTitle(): boolean{
        let isNotValid = false;
        if(this.title === ''){
            isNotValid = true;
            this.validations['title'] = 'The title is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateTitle(this, this.title);
            if(!this.isFocused){
                document.getElementById('input_title').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateConnection(): boolean{
        let isNotValid = false;
        if(this.connectionSelect === null){
            isNotValid = true;
            this.validations['connectionSelect'] = 'The connection is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateConnectionSelect(this, this.connectionSelect);
            if(!this.isFocused){
                document.getElementById('input_connectionSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateAdd(){
        this.isFocused = false;
        const isValidTitle = this.validateTitle();
        const isValidConnection = this.validateConnection();
        return isValidTitle && isValidConnection;
    }

    @App.dispatch(getScheduleById, {mapping: (schedule: ISchedule) => {return schedule.id}, hasNoValidation: true})
    getById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(addSchedule, {mapping: (schedule: ISchedule) => {return schedule.getModel(true)}})
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateSchedule, {mapping: (schedule: ISchedule) => {return schedule.getModel(true)}})
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<ISchedule>(deleteScheduleById, {mapping: (schedule: ISchedule) => {return schedule.id}, hasNoValidation: true})
    deleteById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(checkScheduleTitle, {mapping: (schedule: ISchedule) => {return schedule.getModel()}, hasNoValidation: true})
    checkTitle(): boolean{
        return this.validateTitle();
    }

    getModel(isForApiRequest: boolean = false): ModelSchedule{
        let mappedSchedule: ModelSchedule = {
            title: this.title,
            debugMode: this.debugMode,
            connectionId: parseInt(this.connectionSelect.value.toString()),
            cronExp: this.cronExp,
            status: this.status,
        };
        if(this.id !== 0){
            mappedSchedule.schedulerId = this.id;
        }
        if(!this.cronExp){
            mappedSchedule.status = 0;
        }
        if(!isForApiRequest){
            mappedSchedule.connection = this.connection;
            mappedSchedule.lastExecution = this.lastExecution;
            mappedSchedule.webhook = this.webhook;
        }
        return mappedSchedule;
    }
}