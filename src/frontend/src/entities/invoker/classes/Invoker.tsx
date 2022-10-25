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

import React, {ReactElement, ReactNode} from "react";
import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import {IInput} from "@application/interfaces/core";
import {RootState} from "@application/utils/store";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {InputFileProps} from "@app_component/base/input/file/interfaces";
import {InputTextareaProps} from "@app_component/base/input/textarea/interfaces";
import {
    AuthType,
    IInvoker,
    IInvokerFile,
    IInvokerSelect,
    IInvokerText,
    IInvokerTextarea
} from "../interfaces/IInvoker";
import {InvokerState} from "../redux_toolkit/slices/InvokerSlice";
import {
    addInvoker, checkInvokerName,
    deleteInvokerByName, deleteInvokerImage, getInvokerByName,
    updateInvoker,
    uploadInvokerImage
} from "../redux_toolkit/action_creators/InvokerCreators";
import {IOperation} from "../interfaces/IOperation";
import {Operation} from "./Operation";
import Xml from "../classes/xml/Xml";
import {InputSelectProps, OptionProps} from "@app_component/base/input/select/interfaces";
import RequiredData from "@entity/invoker/components/required_data/RequiredData";


export class Invoker extends HookStateClass implements IInvoker{
    id: number;

    static reduxState?: InvokerState;

    @App.inputType
    name: string = '';

    description: string = '';

    hint: string = '';

    @App.inputType
    authTypeSelect: OptionProps;

    authType: AuthType;

    @App.inputType
    iconFile: FileList;

    icon?: string = '';

    @App.inputType
    operations: Operation[] = [];

    @App.inputType
    requiredData: any = null;
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
        this.authTypeSelect = invoker?.authTypeSelect || null;
        this.authType = invoker?.authType || null;
        this.requiredData = invoker?.requiredData || null;
        if(!this.authTypeSelect && this.authType){
            this.authTypeSelect = {label: this.authType, value: this.authType};
        }
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

    getTexts(data: IInput<IInvokerText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IInvokerText, InputTextProps>(data);
    }

    getSelect(data: IInput<IInvokerSelect, InputSelectProps>): React.ReactElement {
        return super.getInputSelect<IInvokerSelect, InputSelectProps>(data);
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

    getRequiredDataComponent(): ReactElement{
        return <RequiredData initialRequiredData={this.requiredData} authType={this.authTypeSelect?.value.toString() || ''} setRequiredData={(requiredData: any) => {
            //@ts-ignore
            this.updateRequiredData(this, requiredData)
        }}/>;
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
        if(!this.authTypeSelect){
            isNotValid = true;
            this.validations['authTypeSelect'] = 'The Auth Type is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateAuthTypeSelect(this, this.authTypeSelect);
            if(!this.isFocused){
                document.getElementById('input_authTypeSelect').focus();
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
        const isValidAuthType = this.validateAuthType();
        return isValidAuthType;
    }

    @App.dispatch<IInvoker>(getInvokerByName, {mapping: (invoker: IInvoker) => {return invoker.name;}, hasNoValidation: true})
    getByName(): boolean{
        return this.validateName();
    }

    @App.dispatch(addInvoker, {mapping: (invoker: IInvoker) => {return {xml: invoker.getXml(), name: invoker.name}}})
    add(operations: Operation[] = []): boolean{
        // @ts-ignore
        this.authType = this.authTypeSelect.value.toString();
        this.operations = operations;
        return true;
    }

    @App.dispatch(updateInvoker, {mapping: (invoker: IInvoker) => {return {xml: invoker.getXml(), name: invoker.name}}})
    update(operations: Operation[] = []): boolean{
        this.operations = operations;
        return true;
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

    @App.dispatch(checkInvokerName, {mapping: (invoker: IInvoker) => {return invoker.name}, hasNoValidation: true})
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
            auth: this.authTypeSelect.value,
            operations,
        };
        return obj;
    }
}