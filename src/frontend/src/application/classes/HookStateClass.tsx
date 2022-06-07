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

import {Application as App} from "./Application";
import React, {ChangeEvent, ReactElement, ReactNodeArray} from "react";
import {capitalize, isString, isArray, isEmptyObject, isNumber, isObject, putSpaceInCamelWords} from "../utils/utils";
import {IInput} from "../interfaces/core";
import {useAppDispatch, useAppSelector} from "../utils/store";
import {IObservation} from "../interfaces/IApplication";
import {Console} from "./Console";
import {IHookState} from "../interfaces/IHookState";
import InputText from "@app_component/base/input/text/InputText";
import {InputSelectProps} from "@app_component/base/input/select/interfaces";
import InputSelect from "@app_component/base/input/select/InputSelect";
import InputFile from "@app_component/base/input/file/InputFile";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import InputRadios from "@app_component/base/input/radio/InputRadios";

// class to work with form's states
export class HookStateClass implements IHookState {

    // check if input in form is focused
    isFocused: boolean = false;

    // validation messages of the form
    validations: any;

    // set if form is readonly
    _readOnly: boolean;

    // property to update the whole entity in inputType annotation in Application class
    @App.inputType
    wholeInstance: any;

    constructor(validations: any, readonly?: boolean, wholeInstance?: any) {
        this.validations = validations;
        this._readOnly = readonly;
        this.wholeInstance = wholeInstance;
    }

    // read Application.createState class
    static createState<Props>(Instance: any, selector: any, args?: Partial<Props>, observations?: IObservation[]): any {
        Instance.reduxState = useAppSelector(selector);
        const [instance] = App.createState<any>(new Instance(args), useAppDispatch(), observations);
        return instance;
    }

    // to update state of class entity
    updateState?(instance: any): void;

    // to force update of the class entity
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

    // to validate class extended by HookStateClass before dispatch
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

    /**
     * returns InputText component linked to class property with inputType annotation
     * @param data - read IInput
     */
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

    /**
     * returns array of InputText components linked to class properties with inputType annotation
     * @param data - read IInput
     */
    getInputTexts<T, P>(data: IInput<T, P>[]):ReactNodeArray{
        const inputs = [];
        for(let i = 0; i < data.length; i++){
            if(data[i]) {
                inputs.push(this.getInputText<T, P>(data[i]));
            }
        }
        return inputs;
    }

    /**
     * returns InputSelect component linked to class property with inputType annotation
     * @param data - read IInput
     */
    getInputSelect<T, P>(data: IInput<T, P>):ReactElement{
        const updateFunctionName = this.getFunctionName(data.propertyName);
        // @ts-ignore
        let validationMessage = this.validations[data.propertyName] || '';
        let value = null;
        let props: InputSelectProps = data.props;
        // check if property value is clear (without label)
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

    /**
     * returns InputRadios component linked to class property with inputType annotation
     * @param data - read IInput
     */
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

    /**
     * returns InputFile component linked to class property with inputType annotation
     * @param data - read IInput
     */
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

    /**
     * returns InputTextarea component linked to class property with inputType annotation
     * @param data - read IInput
     */
    getInputTextarea<T, P>(data: IInput<T, P>): ReactElement{
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

    /**
     * returns InputSwitch component linked to class property with inputType annotation
     * @param data - read IInput
     */
    getInputSwitch<T, P>(data: IInput<T, P>): ReactElement{
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

    /**
     * return name of the function to update class property with inputType annotation
     * @param name - name of the property
     */
    getFunctionName(name: string | number | symbol): string{
        return `update${capitalize(name)}`;
    }

    /**
     * validate id
     * @param id
     */
    validateId(id: number | string): boolean{
        let isIdValid = id !== 0 && id !== '';
        if(!isIdValid){
            Console.print(`The id is invalid = ${id}`)
        }
        return isIdValid;
    }

}