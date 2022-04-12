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

import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {
    AuthType,
    IInvoker,
    IInvokerFile,
    IInvokerRadios,
    IInvokerText,
    IInvokerTextarea
} from "@interface/invoker/IInvoker";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {RootState} from "@store/store";
import {InvokerState} from "@slice/InvokerSlice";
import {
    addInvoker, checkInvokerName,
    deleteInvokerByName, deleteInvokerImage, getInvokerByName,
    updateInvoker,
    uploadInvokerImage
} from "@action/InvokerCreators";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";
import {IOperation} from "@interface/invoker/IOperation";
import {Operation} from "./Operation";
import Xml from "../xml/Xml";


export class Invoker extends HookStateClass implements IInvoker{
    id: number;

    static reduxState?: InvokerState;

    name: string = '';

    description: string = '';

    hint: string = '';

    @App.inputType
    authType: AuthType;

    @App.inputType
    iconFile: FileList;

    icon?: string = '';

    operations: Operation[] = [];

    requiredData: string[] = [];
    shouldDeletePicture?: boolean = false;

    constructor(invoker?: Partial<IInvoker> | null) {
        // @ts-ignore
        super(invoker?.validations || {}, invoker?._readOnly, invoker?.wholeInstance);
        this.id = invoker?.id || invoker?.invokerId || 0;
        this.name = invoker?.name || '';
        this.description = invoker?.description || '';
        this.hint = invoker?.hint || '';
        this.iconFile = invoker?.iconFile || null;
        this.icon = invoker?.icon || '';
        this.authType = invoker?.authType || null;
        this.requiredData = invoker?.requiredData || [];
        for(let i = 0; i < invoker?.operations?.length; i++){
            this.operations.push(new Operation(invoker.operations[i]));
        }
        this.shouldDeletePicture = invoker?.shouldDeletePicture || false;
        // @ts-ignore
        this.dispatch = invoker.dispatch ? invoker.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<IInvoker>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}];
        return super.createState<IInvoker>(Invoker, (state: RootState) => state.invokerReducer, args, observations);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.invokerReducer);
    }

    getConnection(){
        return this.operations.find((o: IOperation) => o.type === "test") || null;
    }

    getText(data: IInput<IInvokerText, InputTextProps>):ReactElement{
        return super.getInputText<IInvokerText, InputTextProps>(data);
    }

    getTexts(data: IInput<IInvokerText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<IInvokerText, InputTextProps>(data);
    }

    getRadios(data: IInput<IInvokerRadios, InputRadiosProps>): React.ReactElement {
        return super.getInputRadios<IInvokerRadios, InputRadiosProps>(data);
    }

    getFile(data: IInput<IInvokerFile, InputFileProps>): ReactElement {
        data.props.onToggleHasImage = (hasImage: boolean) => {
            this.shouldDeletePicture = hasImage;
            // @ts-ignore
            this.updateIconFile(this, this.iconFile);
        }
        data.props.hasNoImage = this.shouldDeletePicture;
        data.props.hasCheckbox = false;
        return super.getInputFile<IInvokerFile, InputFileProps>(data);
    }

    getTextarea(data: IInput<IInvokerTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IInvokerTextarea, InputTextareaProps>(data);
    }

    validateName(): boolean{
        let isNotValid = false;
        if(this.name === ''){
            isNotValid = true;
            this.validations['name'] = 'The name is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateName(this, this.name);
            if(!this.isFocused){
                document.getElementById('input_name').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateAuthType(): boolean{
        let isNotValid = false;
        if(!this.authType){
            isNotValid = true;
            this.validations['authType'] = 'The Auth Type is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateAuthType(this, this.authType);
            if(!this.isFocused){
                document.getElementById('input_authType').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateOperations(): boolean{
        let isNotValid = false;
        if(this.operations.length === 0){
            isNotValid = true;
            this.validations['operations'] = 'The Operations is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            //this.updateOperations(this, this.operations);
            if(!this.isFocused){
                //document.getElementById('input_operations').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateIcon(): boolean{
        const isIconValid = this.iconFile !== null;
        if(!isIconValid){
            alert(`Icon of invoker with id ${this.id} is not valid`);
        }
        return isIconValid;
    }

    validateAdd(): boolean{
        this.isFocused = false;
        const isValidName = this.validateName();
        const isValidAuthType = this.validateAuthType();
        const isValidOperations = this.validateOperations();
        return isValidName && isValidAuthType && isValidOperations;
    }

    @App.dispatch<IInvoker>(getInvokerByName, {mapping: (invoker: IInvoker) => {return invoker.name;}, hasNoValidation: true})
    getByName(): boolean{
        return this.validateName();
    }

    @App.dispatch(addInvoker, {mapping: (invoker: IInvoker) => {return {xml: invoker.getXml()}}})
    add(connection: Operation, operations: Operation[] = []): boolean{
        let hasConnection = false;
        this.operations = operations;
        for(let i = 0; i < operations.length; i++){
            if(operations[i].type === "test"){
                this.operations[i] = connection;
                hasConnection = true;
                break;
            }
        }
        if(!hasConnection){
            this.operations.unshift(connection);
        }
        return this.validateAdd();
    }

    @App.dispatch(updateInvoker, {mapping: (invoker: IInvoker) => {return {xml: invoker.getXml()}}})
    update(connection: Operation, operations: Operation[] = []): boolean{
        this.operations = operations;
        let hasConnection = false;
        for(let i = 0; i < operations.length; i++){
            if(operations[i].type === "test"){
                this.operations[i] = connection;
                hasConnection = true;
                break;
            }
        }
        if(!hasConnection){
            this.operations.unshift(connection);
        }
        return this.validateAdd();
    }

    @App.dispatch<IInvoker>(deleteInvokerByName, {mapping: (invoker: IInvoker) => {return invoker.name}, hasNoValidation: true})
    deleteByName(): boolean{
        return this.validateName();
    }

    @App.dispatch(uploadInvokerImage, {hasNoValidation: true})
    uploadImage(): boolean{
        return this.validateId(this.id) && this.validateIcon();
    }

    @App.dispatch(deleteInvokerImage, {hasNoValidation: true})
    deleteImage(): boolean{
        return this.validateId(this.id) && this.validateIcon();
    }

    @App.dispatch(checkInvokerName, {hasNoValidation: true})
    checkName(): boolean{
        return this.validateName();
    }

    getXml(): string{
        let xml = Xml.createXml({className: 'invoker', element: this});
        return xml.generateXmlString();
    }

    getObject(){
        let operations = [];
        for (let i = 0; i < this.operations.length; i++){
            operations.push(this.operations[i].getObject());
        }
        let obj = {
            name: this.name,
            description: this.description,
            hint: this.hint,
            icon: this.icon,
            data: this.requiredData,
            auth: this.authType,
            operations,
        };
        return obj;
    }
}