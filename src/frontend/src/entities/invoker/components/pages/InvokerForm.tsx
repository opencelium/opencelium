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

import React, {FC, useEffect, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import {IForm} from "@application/interfaces/IForm";
import {Form} from "@application/classes/Form";
import Button from "@app_component/base/button/Button";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import {Invoker} from "../../classes/Invoker";
import {AuthType, IInvoker} from "../../interfaces/IInvoker";
import {Operation} from "../../classes/Operation";
import {InvokerPermissions} from "../../constants";
import InvokerGeneralData from "../invoker_general_data/InvokerGeneralData";
import {OperationItems} from "../operation_items/OperationItems";
import {setFocusById} from "@application/utils/utils";


const InvokerForm: FC<IForm> = permission<IForm>(InvokerPermissions.CREATE)(({isAdd, isUpdate, isView}) => {
    const {
        addingInvoker, updatingInvoker, gettingInvoker, currentInvoker, error,
    } = Invoker.getReduxState();
    const [nameValidationMessage, setNameValidationMessage] = useState<string>('');
    const [authValidationMessage, setAuthValidationMessage] = useState<string>('');
    const [operationsValidationMessage, setOperationsValidationMessage] = useState<string>('');
    const [isNotValidOperations, setNotValidOperations] = useState<any[]>([]);
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const shouldFetchInvoker = isUpdate || isView;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('invoker');
    let invokerName = '';
    if(shouldFetchInvoker){
        invokerName = urlParams.name;
    }
    const invoker = Invoker.createState<IInvoker>({name: invokerName, _readOnly: isView}, isAdd ? null : currentInvoker);
    const [localOperations, setLocalOperations] = useState<Operation[]>([]);
    useEffect(() => {
        if(shouldFetchInvoker){
            invoker.getByName()
        }
    },[]);
    useEffect(() => {
        if(currentInvoker){
            if(!isAdd){
                setLocalOperations([...currentInvoker.operations].map(o => new Operation(o)));
            }
        }
    }, [currentInvoker])
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (addingInvoker === API_REQUEST_STATE.FINISH || updatingInvoker === API_REQUEST_STATE.FINISH)){
                navigate('/invokers', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingInvoker, updatingInvoker]);
    const Icon = invoker.getFile({propertyName: "iconFile", props: {label: "Icon",}});
    const AuthTypeInput = invoker.getSelect({propertyName: "authTypeSelect", props: {
        required: true,
        icon: 'lock',
        label: 'Authentication',
        error: authValidationMessage,
        options: [{
            label: 'Api Key',
            value: AuthType.ApiKey,
        },{
            label: 'Basic',
            value: AuthType.Basic,
        },{
            label: 'Endpoint Auth',
            value: AuthType.EndpointAuth,
        },{
            label: 'Token',
            value: AuthType.Token,
        }]
    }})
    const RequiredDataComponent = invoker.getRequiredDataComponent();
    const add = () => {
        let isValid = true;
        if(invoker.name === ''){
            setNameValidationMessage('Name is a required field');
            setFocusById('invoker_name');
            isValid = false;
        }
        if(!invoker.authTypeSelect){
            setAuthValidationMessage('Authentication is a required field');
            if(isValid){
                setFocusById('input_authTypeSelect');
                isValid = false;
            }
        }
        if(invoker.operations.length === 0){
            setOperationsValidationMessage('Invoker should contain at least one operation');
            isValid = false;
        }
        const newNotValidOperations = [];
        for(let i = 0; i < localOperations.length; i++){
            if(localOperations[i].name === ''){
                newNotValidOperations.push({index: i, message: 'Name is a required field'});
                isValid = false;
                continue;
            }
            if(!localOperations[i].request.method){
                newNotValidOperations.push({index: i, message: 'Method is a required field'});
                isValid = false;
                continue;
            }
        }
        setNotValidOperations(newNotValidOperations);
        if(isValid){
            invoker.add(localOperations);
        }
    }
    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/invokers'}
        autoFocus={isView}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? add : () => invoker.update(localOperations);
        actions.unshift(<Button
            key={'action_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingInvoker === API_REQUEST_STATE.START || updatingInvoker === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: formData.formTitle}],
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                <InvokerGeneralData nameValidationMessage={nameValidationMessage} invoker={invoker} isAdd={isAdd} isView={isView} isReadonly={isView}/>
                {/*!isView && Icon*/}
            </FormSection>,
            <FormSection label={{value: 'Authentication'}}>
                {AuthTypeInput}
                {RequiredDataComponent}
            </FormSection>,
            <FormSection label={{value: "Operations"}} hasFullWidthInForm={true}>
                <OperationItems error={operationsValidationMessage} validations={isNotValidOperations} operations={localOperations} updateOperations={setLocalOperations} isReadonly={isView}/>
            </FormSection>,
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchInvoker && gettingInvoker === API_REQUEST_STATE.START}/>
    )
})

export default InvokerForm
