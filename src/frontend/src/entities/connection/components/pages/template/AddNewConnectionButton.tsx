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

import React, {ChangeEvent, FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { AddNewConnectionButtonProps } from './interfaces';
import { AddNewConnectionButtonStyled } from './styles';
import Dialog from "@basic_components/Dialog";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {useAppDispatch} from "@application/utils/store";
import { addConnection } from '@entity/connection/redux_toolkit/action_creators/ConnectionCreators';
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import {Connection} from "@entity/connection/classes/Connection";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {ConnectionPermissions} from "@entity/connection/constants";

const AddNewConnectionButton: FC<AddNewConnectionButtonProps> =
    ({
        connection,
    }) => {
        const dispatch = useAppDispatch();
        const {addingConnection} = Connection.getReduxState();
        const [showDialog, setShowDialog] = useState<boolean>(false);
        const toggleDialog = () => {setShowDialog(!showDialog)};
        const [title, setTitle] = useState<string>('');
        const [startAdd, setStartAdd] = useState<boolean>(false);
        const [titleValidationMessage, setTitleValidationMessage] = useState<string>('');
        const [description, setDescription] = useState<string>('');
        const add = () => {
            if(title === '') {
                setTitleValidationMessage('Title is a required field');
                return;
            }
            setStartAdd(true);
            dispatch(addConnection({...connection.getObjectForBackend(), title, description}))
        }
        useEffect(() => {
            if(startAdd && addingConnection === API_REQUEST_STATE.FINISH){
                setTitle('');
                setTitleValidationMessage('');
                setDescription('');
                setStartAdd(false);
                toggleDialog();
            }
        },[addingConnection])
        return (
            <AddNewConnectionButtonStyled >
                <PermissionButton size={TextSize.Size_16} key={'add_button'} icon={'add'} isLoading={addingConnection === API_REQUEST_STATE.START} handleClick={toggleDialog} label={'Add Connection'} permission={ConnectionPermissions.CREATE}/>
                <Dialog
                    actions={[
                        {id: 'add', label: 'Add', onClick: add, isLoading: addingConnection === API_REQUEST_STATE.START},
                        {id: 'cancel', label: 'Cancel', onClick: toggleDialog}]}
                    title={'Add Connection'} active={showDialog} toggle={toggleDialog}>
                    <InputText
                        id={`dialog_input_title`}
                        autoFocus={true}
                        icon={'perm_identity'}
                        label={"Title"}
                        required={true}
                        onChange={(e:ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        title={title}
                        error={titleValidationMessage}
                    />
                    <InputTextarea
                        id={`dialog_input_description`}
                        icon={'notes'}
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        label={'Description'}
                    />
                </Dialog>
            </AddNewConnectionButtonStyled>
        )
    }

AddNewConnectionButton.defaultProps = {
}


export {
    AddNewConnectionButton,
};

export default withTheme(AddNewConnectionButton);