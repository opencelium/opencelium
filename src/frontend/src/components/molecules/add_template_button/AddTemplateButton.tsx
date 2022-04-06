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

import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import { AddTemplateButtonProps } from './interfaces';
import { AddTemplateButtonStyled } from './styles';
import {setFocusById} from "@utils/app";
import {useDispatch} from "react-redux";
import {addTemplate} from "@action/connection/TemplateCreators";
import {Template} from "@class/connection/Template";
import InputText from "@atom/input/text/InputText";
import InputTextarea from "@atom/input/textarea/InputTextarea";
import {ColorTheme} from "../../general/Theme";
import {TextSize} from "@atom/text/interfaces";
import {ConnectionPermissions} from "@constants/permissions";
import {PermissionButton} from "@atom/button/PermissionButton";
import {Dialog} from "@atom/dialog/Dialog";
import {Application} from "@class/application/Application";

const AddTemplateButton: FC<AddTemplateButtonProps> =
    ({
        name,
        description,
        connection,
    }) => {
        const dispatch = useDispatch();
        const {version} = Application.getReduxState();
        const [isOpened, setIsOpened] = useState<boolean>(false);
        const [templateName, setName] = useState<string>(name || '');
        const [templateDescription, setDescription] = useState<string>(description || '');
        const [validateMessageName, setValidateMessageName] = useState<string>('');
        const toggleDialog = () => {
            setIsOpened(!isOpened);
        }
        const onChangeTemplateName = (newName: string) => {
            setName(newName);
            setValidateMessageName('');
        }
        const validateFields = () => {
            let newValidationMessageName = '';
            if(templateName.trim() === ''){
                newValidationMessageName = 'Name is a required field';
                setFocusById('template_name');
            }
            setValidateMessageName(newValidationMessageName);
            return newValidationMessageName === '';
        }
        const addNewTemplate = () => {
            if(validateFields()){
                dispatch(addTemplate(new Template({name: templateName, description: templateDescription, version, connection, dispatch})));
                setIsOpened(!isOpened);
            }
        }
        return (
            <AddTemplateButtonStyled >
                <PermissionButton hasBackground={false} handleClick={toggleDialog} icon={'content_copy'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={ConnectionPermissions.UPDATE}/>
                <Dialog
                    actions={[
                        {id: 'duplicate_ok', label: 'Ok', onClick: addNewTemplate},
                        {id: 'duplicate_cancel', label: 'Cancel', onClick: toggleDialog}]}
                    title={'Create Duplicate'} active={isOpened} toggle={toggleDialog}>
                    <InputText
                        id={`template_name`}
                        error={validateMessageName}
                        onChange={(e) => onChangeTemplateName(e.target.value)}
                        value={templateName}
                        maxLength={256}
                        label={'Title'}
                        icon={'title'}
                        autoFocus
                        required
                    />
                    <InputTextarea
                        id={`template_description`}
                        onChange={(e) => setDescription(e.target.value)}
                        value={templateDescription}
                        label={'Description'}
                        icon={'notes'}
                    />
                </Dialog>
            </AddTemplateButtonStyled>
        )
    }

AddTemplateButton.defaultProps = {
}


export {
    AddTemplateButton,
};

export default withTheme(AddTemplateButton);