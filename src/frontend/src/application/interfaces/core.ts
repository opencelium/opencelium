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

import {ReactElement, ReactNode} from "react";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputSelectProps} from "@app_component/base/input/select/interfaces";
import {InputRadiosProps} from "@app_component/base/input/radio/interfaces";
import {InputFileProps} from "@app_component/base/input/file/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {InputSwitchProps} from "@app_component/base/input/switch/interfaces";

type TextVariableType<T> = keyof T

// properties of HookStateClass methods that returns components
export interface IInput<T, P>{
    // name of the class property
    propertyName: TextVariableType<T>,

    // properties of the component that will be returned
    props?: P | undefined,
}

export interface IForm<Text = {}, Select = {}, Radios = {}, File = {}, Textarea = {}, Switch = {}>{
    getText?(data: IInput<Text, InputTextProps>):ReactElement;
    getSelect?(data: IInput<Select, InputSelectProps>):ReactElement;
    getRadios?(data: IInput<Radios, InputRadiosProps>):ReactElement;
    getFile?(data: IInput<File, InputFileProps>):ReactElement;
    getMultiFiles?(data: IInput<File, InputFileProps>):ReactElement;
    getTextarea?(data: IInput<Textarea, InputTextareaProps>):ReactElement;
    getSwitch?(data: IInput<Switch, InputSwitchProps>):ReactElement;
    getTexts?(data: IInput<Text, InputTextProps>[]):ReactNode[];
    updateState?(instance: any): void;
    _readOnly?: boolean;
}

export interface ICommonState {
    message: string,
    error: any,
}

export enum FormMode{
    ADD= 'add',
    UPDATE= 'update',
    VIEW= 'view',
}