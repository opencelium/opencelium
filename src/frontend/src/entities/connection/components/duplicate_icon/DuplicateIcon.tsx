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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { DuplicateIconProps } from './interfaces';
import { DuplicateIconStyled } from './styles';
import {setFocusById} from "@application/utils/utils";
import {useAppDispatch} from "@application/utils/store";
import {addConnection, checkConnectionTitle, getConnectionById} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {Connection} from "@entity/connection/classes/Connection";
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import Dialog from "@app_component/base/dialog/Dialog";
import {Connector} from "@entity/connector/classes/Connector";
import InputText from "@app_component/base/input/text/InputText";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {getAllConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {ConnectionPermissions} from "@entity/connection/constants";
import Loading from "@app_component/base/loading/Loading";

const DuplicateIcon: FC<DuplicateIconProps> =
    ({
        listConnection,
    }) => {
    const dispatch = useAppDispatch();
    const {gettingConnection, currentConnection, checkingConnectionTitle, isCurrentConnectionHasUniqueTitle} = Connection.getReduxState();
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const [isOpened, setIsOpened] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    const [fromConnector, setFromConnector] = useState(null);
    const [toConnector, setToConnector] = useState(null);
    const [validateMessageTitle, setValidateMessageTitle] = useState('');
    const [validateMessageFromConnector, setValidateMessageFromConnector] = useState('');
    const [validateMessageToConnector, setValidateMessageToConnector] = useState('');
    const fromConnectorOptions = connectors.filter(connector => connector.invoker.name === listConnection.fromConnector.invoker.name).map((connector: any) => {return {label: connector.title, value: connector.connectorId}});
    const toConnectorOptions = connectors.filter(connector => connector.invoker.name === listConnection.toConnector.invoker.name).map((connector: any) => {return {label: connector.title, value: connector.connectorId}});
    const isLoading = gettingConnection !== API_REQUEST_STATE.FINISH || gettingConnectors !== API_REQUEST_STATE.FINISH || currentConnection && currentConnection.connectionId !== listConnection.id;

    const onChangeTitle = (title: string) => {
        setTitle(title);
        setValidateMessageTitle('');
    }
    const onChangeFromConnector = (fromConnector: any) => {
        setFromConnector(fromConnector);
        setValidateMessageFromConnector('');
    }
    const onChangeToConnector = (toConnector: any) => {
        setToConnector(toConnector);
        setValidateMessageToConnector('');
    }
    const toggleDuplicateForm = () => {
        if(isOpened){
            setTitle('');
            setFromConnector(null);
            setToConnector(null);
        }
        setIsOpened(!isOpened);
    }
    const validateFields = () => {
        let validateMessageTitle = '';
        let validateMessageFromConnector = '';
        let validateMessageToConnector = '';
        if(title === ''){
            validateMessageTitle = `Title is a required field`;
            setFocusById('duplicate_title');
        }
        if(!fromConnector){
            validateMessageFromConnector = `From Connector is a required fields`;
            if(validateMessageTitle === '') setFocusById('duplicate_from_connector');
        }
        if(!toConnector){
            validateMessageToConnector = `To Connector is a required fields`;
            if(validateMessageTitle === '' && validateMessageFromConnector === '') setFocusById('duplicate_to_connector');
        }
        setValidateMessageTitle(validateMessageTitle);
        setValidateMessageFromConnector(validateMessageFromConnector);
        setValidateMessageToConnector(validateMessageToConnector);
        if(title !== '' && fromConnector && toConnector){
            //duplicate();
            // @ts-ignore
            const tmpConnection = new Connection({title, dispatch});
            dispatch(checkConnectionTitle(tmpConnection));
        }
        return false;
    }
    const clearFromNodeId = (param: any) => {
        const {nodeId, ...paramProps} = param;
        return paramProps;
    }
    const clearMethodFromNodeId = (method: any) => {
        const requestProps = clearFromNodeId(method.request);
        let responseProps = clearFromNodeId(method.response);
        const successProps = clearFromNodeId(responseProps.success);
        const failProps = clearFromNodeId(responseProps.fail);
        responseProps.success = successProps;
        responseProps.fail = failProps;
        return{
            ...clearFromNodeId(method),
            request: requestProps,
            response: responseProps,
        }
    }
    const duplicate = () => {
        const fromConnectorData: any = fromConnector ? connectors.find(connector => connector.connectorId === fromConnector.value) : null;
        const toConnectorData: any = toConnector ? connectors.find(connector => connector.connectorId === toConnector.value) : null;
        let connection: any = {...currentConnection};
        let tmpFromConnector: any = currentConnection?.fromConnector ? {...currentConnection.fromConnector} : null;
        let fromMethods = tmpFromConnector?.methods ? [...tmpFromConnector.methods] : [];
        fromMethods = fromMethods.map(m => clearMethodFromNodeId(m))
        let tmpToConnector: any = currentConnection?.toConnector ? {...currentConnection.toConnector} : null;
        let toMethods = tmpToConnector?.methods ? [...tmpToConnector.methods] : [];
        toMethods = toMethods.map(m => clearMethodFromNodeId(m))
        if(fromConnectorData && toConnectorData) {
            connection.title = title;
            tmpFromConnector.methods = [...fromMethods];
            tmpFromConnector.connectorId = fromConnectorData.connectorId;
            tmpFromConnector.title = fromConnectorData.title;
            tmpFromConnector.icon = fromConnectorData.icon;
            tmpToConnector.methods = [...toMethods];
            tmpToConnector.connectorId = toConnectorData.connectorId;
            tmpToConnector.title = toConnectorData.title;
            tmpToConnector.icon = toConnectorData.icon;
            connection.fromConnector = {...tmpFromConnector};
            connection.toConnector = {...tmpToConnector};
            delete connection.connectionId;
            if(connection.businessLayout){
                delete connection.businessLayout.id;
            }
            dispatch(addConnection(connection));
            toggleDuplicateForm();
        }
    }
    useEffect(() => {
        if(isOpened) {
            dispatch(getConnectionById(listConnection.id));
            dispatch(getAllConnectors());
        }
    },[isOpened ])

    useEffect(() => {
        if(isCurrentConnectionHasUniqueTitle === TRIPLET_STATE.TRUE){
            duplicate();
        }
        if(isCurrentConnectionHasUniqueTitle === TRIPLET_STATE.FALSE){
            setValidateMessageTitle('Title should be unique');
            setFocusById('duplicate_title');
        }
    }, [checkingConnectionTitle])

    return (
        <DuplicateIconStyled >
            <PermissionTooltipButton target={`duplicate_entity_${listConnection.id.toString()}`} position={'top'} tooltip={'Duplicate'} hasBackground={false} handleClick={toggleDuplicateForm} icon={'content_copy'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={ConnectionPermissions.UPDATE}/>
            <Dialog
                actions={[
                    {id: 'duplicate_ok', label: 'Ok', onClick: validateFields},
                    {id: 'duplicate_cancel', label: 'Cancel', onClick: toggleDuplicateForm}]}
                title={'Create Duplicate'} active={isOpened} toggle={toggleDuplicateForm}>
                {isLoading ? <Loading color={ColorTheme.Blue}/> :
                    <React.Fragment>
                        <InputText
                            id={`input_title`}
                            onChange={(e) => onChangeTitle(e.target.value)}
                            value={title}
                            error={validateMessageTitle}
                            isLoading={checkingConnectionTitle === API_REQUEST_STATE.START}
                            autoFocus
                            required
                            icon={'title'}
                            maxLength={256}
                            label={'Title'}
                        />
                        <InputSelect
                            id={`input_from_connector`}
                            error={validateMessageFromConnector}
                            onChange={(option: any) => onChangeFromConnector(option)}
                            value={fromConnector}
                            required
                            icon={'device_hub'}
                            label={'From Connector'}
                            options={fromConnectorOptions}
                        />
                        <InputSelect
                            id={`input_to_connector`}
                            error={validateMessageToConnector}
                            onChange={(option: any) => onChangeToConnector(option)}
                            value={toConnector}
                            required
                            icon={'device_hub'}
                            label={'To Connector'}
                            options={toConnectorOptions}
                        />
                    </React.Fragment>
                }
            </Dialog>
        </DuplicateIconStyled>
    )
}

DuplicateIcon.defaultProps = {
}


export {
    DuplicateIcon,
};

export default withTheme(DuplicateIcon);