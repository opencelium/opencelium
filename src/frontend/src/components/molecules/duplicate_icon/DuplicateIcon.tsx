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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { DuplicateIconProps } from './interfaces';
import { DuplicateIconStyled } from './styles';
import {setFocusById} from "@utils/app";
import {useAppDispatch} from "../../../hooks/redux";
import {addConnection, checkConnectionTitle, getConnectionById} from "@action/connection/ConnectionCreators";
import {Connection} from "@class/connection/Connection";
import {ColorTheme} from "../../general/Theme";
import {TextSize} from "@atom/text/interfaces";
import {PermissionButton} from "@atom/button/PermissionButton";
import {ConnectionPermissions} from "@constants/permissions";
import {Dialog} from "@atom/dialog/Dialog";
import {Connector} from "@class/connector/Connector";
import InputText from "@atom/input/text/InputText";
import InputSelect from "@atom/input/select/InputSelect";
import {Loading} from "@molecule/loading/Loading";
import {getAllConnectors} from "@action/ConnectorCreators";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";

const DuplicateIcon: FC<DuplicateIconProps> =
    ({
        listConnection,
    }) => {
    const dispatch = useAppDispatch();
    const {gettingConnection, connection, checkingConnectionTitle, isCurrentConnectionHasUniqueTitle} = Connection.getReduxState();
    const {connectors, gettingConnectors} = Connector.getReduxState();
    const [isOpened, setIsOpened] = useState<boolean>(false);
    const [title, setTitle] = useState<string>('');
    const [fromConnector, setFromConnector] = useState(null);
    const [toConnector, setToConnector] = useState(null);
    const [validateMessageTitle, setValidateMessageTitle] = useState('');
    const [validateMessageFromConnector, setValidateMessageFromConnector] = useState('');
    const [validateMessageToConnector, setValidateMessageToConnector] = useState('');
    const fromConnectorOptions = connectors.filter(connector => connector.invoker.name === listConnection.fromConnector.invoker.name).map((connector: any) => {return {label: connector.name, value: connector.id}});
    const toConnectorOptions = connectors.filter(connector => connector.invoker.name === listConnection.toConnector.invoker.name).map((connector: any) => {return {label: connector.name, value: connector.id}});
    const isLoading = gettingConnection !== API_REQUEST_STATE.FINISH || gettingConnectors !== API_REQUEST_STATE.FINISH || connection && connection.connectionId !== listConnection.connectionId;

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
            validateMessageTitle = `ADD.VALIDATION_MESSAGES.TITLE_REQUIRED`;
            setFocusById('duplicate_title');
        }
        if(!fromConnector){
            validateMessageFromConnector = `ADD.VALIDATION_MESSAGES.FROM_CONNECTOR_REQUIRED`;
            if(validateMessageTitle === '') setFocusById('duplicate_from_connector');
        }
        if(!toConnector){
            validateMessageToConnector = `ADD.VALIDATION_MESSAGES.TO_CONNECTOR_REQUIRED`;
            if(validateMessageTitle === '' && validateMessageFromConnector === '') setFocusById('duplicate_to_connector');
        }
        setValidateMessageTitle(validateMessageTitle);
        setValidateMessageFromConnector(validateMessageFromConnector);
        setValidateMessageToConnector(validateMessageToConnector);
        if(title !== '' && fromConnector && toConnector){
            dispatch(checkConnectionTitle(new Connection({title})));
        }
        return false;
    }
    const duplicate = () => {
        const fromConnectorData: any = fromConnector ? connectors.find(connector => connector.id === fromConnector.value) : null;
        const toConnectorData: any = toConnector ? connectors.find(connector => connector.id === toConnector.value) : null;
        if(fromConnectorData && toConnectorData) {
            connection.title = title;
            connection.fromConnector.connectorId = fromConnectorData.id;
            connection.fromConnector.title = fromConnectorData.name;
            connection.fromConnector.icon = fromConnectorData.icon;
            connection.toConnector.connectorId = toConnectorData.id;
            connection.toConnector.title = toConnectorData.name;
            connection.toConnector.icon = toConnectorData.icon;
            delete connection.connectionId;
            if(connection.businessLayout){
                delete connection.businessLayout.id;
            }
            dispatch(addConnection(connection));
            toggleDuplicateForm();
        }
    }
    return (
        <DuplicateIconStyled >
            <PermissionButton hasBackground={false} handleClick={toggleDuplicateForm} icon={'content_copy'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={ConnectionPermissions.UPDATE}/>
            <Dialog
                styles={{body: {margin: '0 auto'}}}
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