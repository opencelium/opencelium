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

import React, {ChangeEvent, ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    IConnector,
    IConnectorFile,
    IConnectorSelect, IConnectorSwitch,
    IConnectorText,
    IConnectorTextarea
} from "@interface/connector/IConnector";
import {IInput} from "@interface/application/core";
import {InputTextProps, InputTextType} from "@atom/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {RootState} from "@store/store";
import {ConnectorState} from "@slice/ConnectorSlice";
import InputText from "@atom/input/text/InputText";
import {capitalize} from "../../utils";
import {putSpaceInCamelWords} from "../../components/utils";
import {addConnector, deleteConnectorById, getConnectorById, updateConnector} from "@action/ConnectorCreators";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {IInvoker} from "@interface/invoker/IInvoker";
import {InputSwitchProps} from "@atom/input/switch/interfaces";


export class Connector extends HookStateClass implements IConnector{
    id: number;

    static reduxState?: ConnectorState;

    @App.inputType
    title: string = '';

    @App.inputType
    description: string = '';

    invokerDescription: string = '';

    @App.inputType
    sslCert: boolean = false;

    @App.inputType
    timeout: number = 0;

    @App.inputType
    iconFile: FileList;

    @App.inputType
    invokerSelect: OptionProps;

    @App.inputType
    requestData: any;

    invoker: IInvoker = null;

    icon?: string = '';
    shouldDeleteIcon?: boolean = false;


    constructor(connector?: Partial<IConnector> | null) {
        // @ts-ignore
        super(connector?.validations || {}, connector?._readOnly, connector?.wholeInstance);
        this.id = connector?.id || connector?.connectorId || 0;
        this.title = connector?.title || '';
        this.description = connector?.description || '';
        this.sslCert = connector?.sslCert || false;
        this.timeout = connector?.timeout || 0;
        this.iconFile = connector?.iconFile || null;
        this.icon = connector?.icon || '';
        this.invokerSelect = connector?.invokerSelect || null;
        this.invoker = connector?.invoker || null;
        if(!this.invokerSelect && this.invoker){
            this.invokerSelect = {label: this.invoker.name, value: this.invoker.name, data: this.invoker.requiredData};
        }
        this.shouldDeleteIcon = connector?.shouldDeleteIcon || false;
        this.requestData = connector?.requestData || null;
        // @ts-ignore
        this.dispatch = connector.dispatch ? connector.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<IConnector>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}];
        return super.createState<IConnector>(
            Connector,
            (state: RootState) => state.connectorReducer,
            args,
            observations);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.connectorReducer);
    }

    getText(data: IInput<IConnectorText, InputTextProps>):ReactElement{
        return super.getInputText<IConnectorText, InputTextProps>(data);
    }

    getTexts(data: IInput<IConnectorText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<IConnectorText, InputTextProps>(data);
    }

    getSelect(data: IInput<IConnectorSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<IConnectorSelect, InputSelectProps>(data);
    }

    getSwitch(data: IInput<IConnectorSwitch, InputSwitchProps>):ReactElement{
        return super.getInputSwitch<IConnectorSwitch, InputSwitchProps>(data);
    }

    getFile(data: IInput<IConnectorFile, InputFileProps>): ReactElement {
        data.props.onToggleHasImage = (hasImage: boolean) => {
            this.shouldDeleteIcon = hasImage;
            // @ts-ignore
            this.updateProfilePictureFile(this, this.iconFile);
        }
        data.props.hasNoImage = this.shouldDeleteIcon;
        data.props.hasCheckbox = false;
        return super.getInputFile<IConnectorFile, InputFileProps>(data);
    }

    getTextarea(data: IInput<IConnectorTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IConnectorTextarea, InputTextareaProps>(data);
    }

    getCredentials({error}: InputTextProps): any[]{
        let credentials: any[] = [];
        if(this.invokerSelect) {
            for(let i = 0; i < this.invokerSelect.data.length; i++){
                let errorMessage = this.validations[`_${this.invokerSelect.data[i]}`] || error || '';
                let icon = 'perm_identity';
                let type = InputTextType.Text;
                let credentialName = this.invokerSelect.data[i];
                if(credentialName.toLowerCase().includes('url')){
                    icon = 'link';
                }
                if(credentialName.toLowerCase().includes('password') || credentialName.toLowerCase().includes('key')){
                    icon = 'password';
                    type = InputTextType.Password;
                }
                credentials.push(<InputText
                    id={`input_${credentialName}`}
                    readOnly={this._readOnly}
                    error={errorMessage}
                    key={credentialName}
                    icon={icon}
                    label={capitalize(putSpaceInCamelWords(credentialName))}
                    type={type}
                    required
                    // @ts-ignore
                    onChange={(e:ChangeEvent<HTMLInputElement>) => {this.validations[`_${this.invokerSelect.data[i]}`] = ''; this[`updateRequestData`](this, {...this.requestData, [credentialName]: e.target.value})}}
                    // @ts-ignore
                    value={this.requestData ? this.requestData[credentialName] : ''}
                />);
            }
        }
        return credentials;
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

    validateInvoker(): boolean{
        let isNotValid = false;
        if(this.invokerSelect === null){
            isNotValid = true;
            this.validations['invokerSelect'] = 'The invoker is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateInvokerSelect(this, this.invokerSelect);
            if(!this.isFocused){
                document.getElementById('input_invokerSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateRequestData(){
        let isValid = true;
        let index = -1;
        for(let i = 0; i < this.invokerSelect.data.length; i++){
            if(!this.requestData || !this.requestData.hasOwnProperty(this.invokerSelect.data[i]) || this.requestData[this.invokerSelect.data[i]] === ''){
                this.validations[`_${this.invokerSelect.data[i]}`] = `${capitalize(putSpaceInCamelWords(this.invokerSelect.data[i]))} is a required field`;
                isValid = false;
                if(index === -1){
                    index = i;
                }
            }
        }
        if(!isValid){
            this.forceUpdate(this);
            if(index !== -1) {
                if (!this.isFocused) {
                    document.getElementById(`input_${this.invokerSelect.data[index]}`).focus();
                    this.isFocused = true;
                }
            }
        }
        return isValid;
    }

    validateAdd(){
        this.isFocused = false;
        const isValidTitle = this.validateTitle();
        const isValidInvoker = this.validateInvoker();
        const isValidRequestData = this.validateRequestData();
        return isValidTitle && isValidInvoker && isValidRequestData;
    }

    @App.dispatch(getConnectorById, {mapping: (connector: IConnector) => {return connector.id;}, hasNoValidation: true})
    getById(){
        return this.validateId(this.id);
    }

    @App.dispatch(addConnector)
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateConnector)
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<IConnector>(deleteConnectorById, {hasNoValidation: true})
    deleteById(){
        return this.validateId(this.id);
    }

}