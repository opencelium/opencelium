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

import React, {FC, useEffect, useRef, useState} from "react";
import {Invoker} from "@class/invoker/Invoker";
import Button from "@atom/button/Button";
import FormSection from "@organism/form_section/FormSection";
import FormComponent from "@organism/form/Form";
import {AuthType, IInvoker} from "@interface/invoker/IInvoker";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {permission} from "../../../decorators/permission";
import {IForm} from "@interface/application/IForm";
import {InvokerPermissions} from "@constants/permissions";
import {useNavigate, useParams} from "react-router";
import {Form} from "@class/application/Form";
import {RadiosAlign} from "@atom/input/radio/interfaces";
import OperationItem from "@organism/operation_item/OperationItem";
import OperationItems from "@organism/operation_items/OperationItems";
import {Operation} from "@class/invoker/Operation";
import InvokerGeneralData from "@molecule/invoker_general_data/InvokerGeneralData";


const InvokerForm: FC<IForm> = permission<IForm>(InvokerPermissions.CREATE)(({isAdd, isUpdate, isView}) => {
    const {
        addingInvoker, updatingInvoker, gettingInvoker, currentInvoker, error,
    } = Invoker.getReduxState();
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
    const [connection, setConnection] = useState<Operation>(new Operation({type: "test"}));
    const [localOperations, setLocalOperations] = useState<Operation[]>([]);
    const updateConnection = (newConnection: Operation) => {
        setConnection(new Operation({...newConnection}));
    }
    useEffect(() => {
        if(shouldFetchInvoker){
            invoker.getByName()
        }
    },[]);
    useEffect(() => {
        if(currentInvoker){
            if(!isAdd){
                setConnection(new Operation({...currentInvoker.operations.find(o => o.type === 'test')} || null))
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
    const AuthTypeInput = invoker.getRadios({propertyName: "authType", props: {
        align: RadiosAlign.Horizontal,
        icon: 'lock',
        label: 'Authentication',
        options: [{
            label: 'Api Key',
            value: AuthType.ApiKey,
            key: AuthType.ApiKey,
        },{
            label: 'Basic',
            value: AuthType.Basic,
            key: AuthType.Basic,
        },{
            label: 'Endpoint Auth',
            value: AuthType.EndpointAuth,
            key: AuthType.EndpointAuth,
        },{
            label: 'Token',
            value: AuthType.Token,
            key: AuthType.Token,
        }]
    }})
    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/invokers'}
        autoFocus={isView}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => invoker.add(connection, localOperations) : () => invoker.update(connection, localOperations);
        actions.unshift(<Button
            key={'add_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingInvoker === API_REQUEST_STATE.START || updatingInvoker === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: [{name: 'Admin Cards', link: '/admin_cards'}, {name: formData.formTitle}],
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                <InvokerGeneralData invoker={invoker} isAdd={isAdd} isView={isView} isReadonly={isView}/>
                {/*!isView && Icon*/}
            </FormSection>,
            <FormSection label={{value: 'Authentication'}}>
                {AuthTypeInput}
            </FormSection>,
            <FormSection label={{value: "Connection"}}>
                {
                    // @ts-ignore
                    <OperationItem operationItem={connection} isReadonly={isView} updateOperation={updateConnection}/>
                }
            </FormSection>,
            <FormSection label={{value: "Operations"}}>
                <OperationItems operations={localOperations.filter(operation => operation.type !== 'test')} updateOperations={setLocalOperations} isReadonly={isView}/>
            </FormSection>,
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchInvoker && gettingInvoker === API_REQUEST_STATE.START}/>
    )
})

export default InvokerForm