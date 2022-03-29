import {TextVariableType} from "../../types/HookState";
import {InputTextProps} from "@atom/input/text/interfaces";
import {ReactElement, ReactNodeArray} from "react";
import {InputSelectProps} from "@atom/input/select/interfaces";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {InputSwitchProps} from "@atom/input/switch/interfaces";

export interface IInput<T, P>{
    propertyName: TextVariableType<T>,
    props?: P | undefined,
}

export interface IForm<Text = {}, Select = {}, Radios = {}, File = {}, Textarea = {}, Switch = {}>{
    getText?(data: IInput<Text, InputTextProps>):ReactElement;
    getSelect?(data: IInput<Select, InputSelectProps>):ReactElement;
    getRadios?(data: IInput<Radios, InputRadiosProps>):ReactElement;
    getFile?(data: IInput<File, InputFileProps>):ReactElement;
    getTextarea?(data: IInput<Textarea, InputTextareaProps>):ReactElement;
    getSwitch?(data: IInput<Switch, InputSwitchProps>):ReactElement;
    getTexts?(data: IInput<Text, InputTextProps>[]):ReactNodeArray;
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