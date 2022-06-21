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

import React, {FC, useState} from 'react';
import {useDispatch} from "react-redux";
import {withTheme} from 'styled-components';
import {setFocusById} from "@application/utils/utils";
import {Application} from "@application/classes/Application";
import InputText from "@app_component/base/input/text/InputText";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import {TextSize} from "@app_component/base/text/interfaces";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import Dialog from "@app_component/base/dialog/Dialog";
import {Template} from "@entity/connection/classes/Template";
import {TemplatePermissions} from "../../constants";
import {ColorTheme} from "@style/Theme";
import { AddTemplateButtonProps } from './interfaces';
import { AddTemplateButtonStyled } from './styles';
import {addTemplate} from "../../redux_toolkit/action_creators/TemplateCreators";

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
                <PermissionButton hasBackground={false} handleClick={toggleDialog} icon={'content_copy'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={TemplatePermissions.UPDATE}/>
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