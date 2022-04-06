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

import {Application as App} from "./Application";
import InputText from "@atom/input/text/InputText";
import React, {ChangeEvent, ReactElement, ReactNodeArray} from "react";
import {capitalize, isString} from "../../utils";
import {IInput} from "@interface/application/core";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import InputSelect from "@atom/input/select/InputSelect";
import InputRadios from "@atom/input/radio/InputRadios";
import InputFile from "@atom/input/file/InputFile";
import InputTextarea from "@atom/input/textarea/InputTextarea";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import InputSwitch from "@atom/input/switch/InputSwitch";
import {isArray, isEmptyObject, isNumber, isObject, putSpaceInCamelWords} from "../../components/utils";
import {IObservation} from "@interface/application/IApplication";
import {Console} from "./Console";
import {IHookState} from "@interface/application/IHookState";


export class HookStateClass implements IHookState {

    isFocused: boolean = false;

    validations: any;

    _readOnly: boolean;


    @App.inputType
    wholeInstance: any;

    constructor(validations: any, readonly?: boolean, wholeInstance?: any) {
        this.validations = validations;
        this._readOnly = readonly;
        this.wholeInstance = wholeInstance;
    }

    static createState<Props>(Instance: any, selector: any, args?: Partial<Props>, observations?: IObservation[]): any {
        Instance.reduxState = useAppSelector(selector);
        const [instance] = App.createState<any>(new Instance(args), useAppDispatch(), observations);
        return instance;
    }

    updateState?(instance: any): void;

    forceUpdate(reference: any){
        const Instance = reference.getClass();
        const newData = new Instance({...reference});
        if (typeof reference.update === 'function') {
            reference.update(newData);
        }
    }

    dispatch?(instance: any): void;

    getClass(): any {
        return this.constructor;
    }

    validate(){
        let isValid = true;
        let validationMessages = {};
        let paramName = '';
        let hasFocused = false;
        for(let param in this){
            // @ts-ignore
            if(typeof this[`${param}ValidationMessageRequired`] !== 'undefined'){
                paramName = param;
                // @ts-ignore
                let value : any = this[param];
                if(
                    (typeof value === 'string' && value === '') ||
                    (isArray(value) && value.length === 0) ||
                    (value === null) ||
                    (isObject(value) && isEmptyObject(value))){
                    // @ts-ignore
                    validationMessages[param] = `${capitalize(putSpaceInCamelWords(param))} is a required field`;
                    if(!hasFocused){
                        document.getElementById(`input_${param}`).focus();
                    }
                    isValid = false;
                } else{
                    // @ts-ignore
                    validationMessages[param] = ``;
                }
            }
        }
        if(paramName !== ''){
            this.validations = validationMessages;
            // @ts-ignore
            this[`${paramName}ValidationMessageRequired`](this, validationMessages);
        }
        return isValid;
    }

    getInputText<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        const validationMessage = data.props.error || this.validations[data.propertyName] || '';
        return(
            <InputText
                id={`input_${data.propertyName.toString()}`}
                key={data.propertyName.toString()}
                readOnly={this._readOnly}
                // @ts-ignore
                onChange={(e:ChangeEvent<HTMLInputElement>) => this[updateFunctionName](this, e.target.value)}
                // @ts-ignore
                value={this[data.propertyName]}
                {...data.props}
                error={validationMessage}
            />
        );
    }
    getInputTexts<T, P>(data: IInput<T, P>[]):ReactNodeArray{
        const inputs = [];
        for(let i = 0; i < data.length; i++){
            if(data[i]) {
                inputs.push(this.getInputText<T, P>(data[i]));
            }
        }
        return inputs;
    }
    getInputSelect<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        let validationMessage = this.validations[data.propertyName] || '';
        let value = null;
        let props: InputSelectProps = data.props;
        // @ts-ignore
        if(isString(this[data.propertyName]) || isNumber(this[data.propertyName])){
            // @ts-ignore
            value = props.options.find(option => option.value === this[data.propertyName]);
        } else{
            // @ts-ignore
            value = this[data.propertyName];
        }
        return(
            <InputSelect
                id={`input_${data.propertyName.toString()}`}
                readOnly={this._readOnly}
                error={validationMessage}
                // @ts-ignore
                onChange={(option: OptionProps) => this[updateFunctionName](this, option, data.props.callback)}
                // @ts-ignore
                value={value}
                {...props}
            />
        );
    }
    getInputRadios<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        let validationMessage = this.validations[data.propertyName] || '';
        return(
            // @ts-ignore
            <InputRadios
                readOnly={this._readOnly}
                error={validationMessage}
                onChange={(e:ChangeEvent<HTMLInputElement>) => {
                    // @ts-ignore
                    this[updateFunctionName](this, e.target.value)
                    // @ts-ignore
                    if(data.props && typeof data.props.callback === 'function')  data.props.callback(e)
                }}
                // @ts-ignore
                value={this[data.propertyName]}
                {...data.props}
            />
        );
    }
    getInputFile<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        let validationMessage = this.validations[data.propertyName] || '';
        return(
            <InputFile
                id={`input_${data.propertyName.toString()}`}
                readOnly={this._readOnly}
                icon={'photo'}
                error={validationMessage}
                // @ts-ignore
                onChange={(file) => this[updateFunctionName](this, [file])}
                // @ts-ignore
                value={this[data.propertyName]}
                accept={'image/png, image/jpeg'}
                {...data.props}
            />
        );
    }
    getInputTextarea<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        let validationMessage = this.validations[data.propertyName] || '';
        return(
            <InputTextarea
                id={`input_${data.propertyName.toString()}`}
                readOnly={this._readOnly}
                icon={'notes'}
                error={validationMessage}
                // @ts-ignore
                onChange={(e:ChangeEvent<HTMLInputElement>) => this[updateFunctionName](this, e.target.value)}
                // @ts-ignore
                value={this[data.propertyName]}
                {...data.props}
            />
        );
    }
    getInputSwitch<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        let validationMessage = this.validations[data.propertyName] || '';
        return(
            <InputSwitch
                id={`input_${data.propertyName.toString()}`}
                readOnly={this._readOnly}
                error={validationMessage}
                // @ts-ignore
                onClick={() => this[updateFunctionName](this, !this[data.propertyName])}
                // @ts-ignore
                isChecked={this[data.propertyName]}
                {...data.props}
            />
        );
    }

    getFunctionName(name: string | number | symbol): string{
        return `update${capitalize(name)}`;
    }

    validateId(id: number | string): boolean{
        let isIdValid = id !== 0 && id !== '';
        if(!isIdValid){
            Console.print(`The id is invalid = ${id}`)
        }
        return isIdValid;
    }

}