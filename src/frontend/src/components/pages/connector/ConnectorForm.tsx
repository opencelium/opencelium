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
import {Connector} from "@class/connector/Connector";
import Button from "@atom/button/Button";
import FormSection from "@organism/form_section/FormSection";
import FormComponent from "@organism/form/Form";
import {IConnector} from "@interface/connector/IConnector";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";
import {useAppDispatch} from "../../../hooks/redux";
import {testRequestData,} from "@action/ConnectorCreators";
import {IForm} from "@interface/application/IForm";
import {Invoker} from "@class/invoker/Invoker";
import {useNavigate, useParams} from "react-router";
import {Form} from "@class/application/Form";
import {getAllInvokers} from "@action/InvokerCreators";
import {OptionProps} from "@atom/input/select/interfaces";
import {InputTextType} from "@atom/input/text/interfaces";


const ConnectorForm: FC<IForm> = ({isAdd, isUpdate}) => {
    const {
        gettingConnector, currentConnector, addingConnector, checkingConnectorTitle, isCurrentConnectorHasUniqueTitle,
        isCurrentConnectorHasInvalidRequestData, testingRequestData, updatingConnector, error,
    } = Connector.getReduxState();
    const dispatch = useAppDispatch();
    const {gettingInvokers, invokers} = Invoker.getReduxState();
    const [shouldNavigateToConnection, setShouldNavigateToConnection] = useState<boolean>(false);
    const invokerOptions: OptionProps[] = invokers.map(invoker => {return {label: invoker.name, value: invoker.name, data: invoker.requiredData}});
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const shouldFetchConnector = isUpdate;
    const form = new Form({isAdd, isUpdate});
    const formData = form.getFormData('connector');
    let connectorId = 0;
    if(shouldFetchConnector){
        connectorId = parseInt(urlParams.id);
    }
    const connector = Connector.createState<IConnector>({id: connectorId}, isAdd ? null : currentConnector);
    const credentialErrorMessage = isCurrentConnectorHasInvalidRequestData === TRIPLET_STATE.TRUE ? 'Wrong credential data' : '';
    const Credentials = connector.getCredentials({error: credentialErrorMessage});
    useEffect(() => {
        if(shouldFetchConnector){
            connector.getById()
        }
        dispatch(getAllInvokers());
    },[]);
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (isAdd && addingConnector === API_REQUEST_STATE.FINISH || isUpdate && updatingConnector === API_REQUEST_STATE.FINISH)){
                if(shouldNavigateToConnection){
                    navigate('/connections/add', { replace: false });
                } else{
                    navigate('/connectors', { replace: false });
                }
            }
        } else {
            didMount.current = true;
        }
    },[addingConnector, updatingConnector]);
    const test = () => {
        dispatch(testRequestData(connector.getPoustModel()));
    }
    const TitleInput = connector.getText({
        propertyName: "title", props: {autoFocus: true, icon: 'title', label: 'Title', required: true, isLoading: checkingConnectorTitle === API_REQUEST_STATE.START, error: isCurrentConnectorHasUniqueTitle === TRIPLET_STATE.FALSE ? 'The title is already in use' : ''}
    })
    const DescriptionInput = connector.getTextarea({
        propertyName: "description", props: {label: "Description"}
    })
    const InvokerComponent = connector.getSelect({propertyName: 'invokerSelect', props: {
        icon: 'description',
        label: 'Invoker',
        options: invokerOptions,
        isLoading: gettingInvokers === API_REQUEST_STATE.START,
        required: true,
        callback: (reference) => {reference.requestData = null;}
    }})
    const InvokerDescriptionInput = connector.getTextarea({
        propertyName: "invokerDescription", props:{
            label: 'Description',
            readOnly: true,
            value: "Here you will see the description of the invoker",
        }
    })
    const TimeoutInput = connector.getText({
        propertyName: "timeout", props: {icon: 'history_toggle_off', label: 'Timeout', type: InputTextType.Number}
    })
    const SslCertInput = connector.getSwitch({
        propertyName: "sslCert", props: {icon: 'verified', label: 'SSL Certificate', name: connector.sslCert ? 'SSL Certificate is activated' : 'SSL Certificate is deactivated'}
    })
    const Icon = connector.getFile({propertyName: "iconFile", props: {label: "Icon",}});
    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/connectors'}
    />];
    if(isAdd || isUpdate){
        let handleAddClick = isAdd ? () => {setShouldNavigateToConnection(false); connector.add()} : () => connector.update();
        let handleAddAndGoToConnection = () => {setShouldNavigateToConnection(true); connector.add()};
        if(isAdd) {
            actions.unshift(<Button
                key={'add_and_go_to_connection_button'}
                label={'Add & Go to Add Connection'}
                icon={'add'}
                handleClick={handleAddAndGoToConnection}
                isLoading={addingConnector === API_REQUEST_STATE.START && shouldNavigateToConnection}
            />);
        }
        actions.unshift(<Button
            key={'action_button'}
            label={`${formData.actionButton.label} & Close`}
            icon={formData.actionButton.icon}
            handleClick={handleAddClick}
            isLoading={isAdd && addingConnector === API_REQUEST_STATE.START && !shouldNavigateToConnection || isUpdate && updatingConnector === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: formData.formTitle,
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                {TitleInput}
                {DescriptionInput}
                {InvokerComponent}
                {InvokerDescriptionInput}
                {TimeoutInput}
                {SslCertInput}
                {Icon}
            </FormSection>,
            <FormSection label={{value: 'Credentials'}} dependencies={[!connector.invokerSelect]}>
                {Credentials}
                <Button
                    float={'right'}
                    key={'add_button'}
                    label={'Test'}
                    icon={'refresh'}
                    handleClick={test}
                    isLoading={testingRequestData === API_REQUEST_STATE.START}
                />
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchConnector && gettingConnector === API_REQUEST_STATE.START}/>
    )
}

export default ConnectorForm