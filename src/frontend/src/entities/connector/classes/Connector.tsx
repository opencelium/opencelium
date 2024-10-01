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

import React, {ChangeEvent, ReactElement, ReactNode, ReactNodeArray} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {IEntityWithImage} from "@application/requests/interfaces/IRequest";
import {capitalize, putSpaceInCamelWords} from "@application/utils/utils";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {InputSelectProps, OptionProps} from "@app_component/base/input/select/interfaces";
import {InputTextProps, InputTextType} from "@app_component/base/input/text/interfaces";
import {InputSwitchProps} from "@app_component/base/input/switch/interfaces";
import {InputFileProps} from "@app_component/base/input/file/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import InputText from "@app_component/base/input/text/InputText";
import {IInvoker} from "@entity/invoker/interfaces/IInvoker";
import {ConnectorState} from "../redux_toolkit/slices/ConnectorSlice";
import {
    addConnector,
    deleteConnectorById,
    getConnectorById,
    updateConnector
} from "../redux_toolkit/action_creators/ConnectorCreators";
import ModelConnectorPoust from "../requests/models/ConnectorPoust";
import {
    IConnector,
    IConnectorFile,
    IConnectorSelect,
    IConnectorSwitch,
    IConnectorText,
    IConnectorTextarea
} from "../interfaces/IConnector";


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
        this.timeout = connector?.timeout || 1000;
        this.iconFile = connector?.iconFile || null;
        this.icon = connector?.icon || '';
        this.invokerSelect = connector?.invokerSelect || null;
        this.invoker = connector?.invoker || null;
        if(!this.invokerSelect && this.invoker){
            this.invokerSelect = {
                label: this.invoker.name,
                value: this.invoker.name,
                data: this.invoker.requiredData
            };
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

    getTexts(data: IInput<IConnectorText, InputTextProps>[]):ReactNode[]{
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
            const keys = Object.keys(this.invokerSelect.data);
            keys.forEach((key, i) => {
                let errorMessage = this.validations[`_${keys[i]}`] || error || '';
                let icon = 'perm_identity';
                let type = InputTextType.Text;
                let credentialName = keys[i];
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
                    onChange={(e:ChangeEvent<HTMLInputElement>) => {this.validations[`_${keys[i]}`] = ''; this[`updateRequestData`](this, {...this.requestData, [credentialName]: e.target.value})}}
                    // @ts-ignore
                    value={this.requestData && this.requestData[credentialName] !== undefined ? this.requestData[credentialName] : this.invokerSelect.data[key]}
                />);
            })
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
                const element = document.getElementById(`input_title`);
                if(element){
                    element.focus();
                    this.isFocused = true;
                }
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
                const element = document.getElementById(`input_invokerSelect`);
                if(element){
                    element.focus();
                    this.isFocused = true;
                }
            }
            return false;
        }
        return true;
    }

    validateRequestData(){
        let isValid = true;
        let index = -1;
        const keys = this.invokerSelect ? Object.keys(this.invokerSelect.data) : null;
        if(this.invokerSelect) {
            this.requestData = this.requestData === null ? this.invokerSelect.data : this.requestData;
            keys.forEach((key, i) => {
                if (!this.requestData || !this.requestData.hasOwnProperty(keys[i]) || this.requestData[keys[i]] === '') {
                    this.validations[`_${keys[i]}`] = `${capitalize(putSpaceInCamelWords(keys[i]))} is a required field`;
                    isValid = false;
                    if (index === -1) {
                        index = i;
                    }
                }
            })
        }
        if(!isValid){
            // @ts-ignore
            this.updateInvokerSelect(this, this.invokerSelect);
            if(index !== -1) {
                if (!this.isFocused) {
                    const element = document.getElementById(`input_${keys[index]}`);
                    if(element){
                        element.focus();
                        this.isFocused = true;
                    }
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

    @App.dispatch(addConnector, {mapping: (connector: IConnector):IEntityWithImage<ModelConnectorPoust> => { return {entityData: connector.getPoustModel(), iconFile: connector.iconFile, shouldDeleteIcon: connector.shouldDeleteIcon};}})
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateConnector, {mapping: (connector: IConnector):IEntityWithImage<ModelConnectorPoust> => { return {entityData: connector.getPoustModel(), iconFile: connector.iconFile, shouldDeleteIcon: connector.shouldDeleteIcon};}})
    update(title?: string): boolean{
        if(title){
            this.title = title;
            return true;
        }
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<IConnector>(deleteConnectorById, {mapping: (connector: IConnector) => {return connector.id;}, hasNoValidation: true})
    deleteById(){
        return this.validateId(this.id);
    }

    getPoustModel(): ModelConnectorPoust{
        const requestData: any = {};
        for(let param in this.requestData) {
            requestData[param] = this.requestData[param].trim();
        }
        let mappedConnector: ModelConnectorPoust = {
            title: this.title,
            description: this.description,
            invoker: {name: this.invokerSelect.value.toString()},
            requestData: requestData,
            sslCert: this.sslCert,
            timeout: this.timeout,
        };
        if(this.id !== 0){
            return {
                connectorId: this.id,
                ...mappedConnector,
            }
        }
        return mappedConnector;
    }

}
