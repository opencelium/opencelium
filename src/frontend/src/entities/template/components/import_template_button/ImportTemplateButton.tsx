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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { ImportTemplateButtonProps } from './interfaces';
import { ImportTemplateButtonStyled } from './styles';
import {useAppDispatch} from "@application/utils/store";
import {checkTemplateId, importTemplate} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import Dialog from "@app_component/base/dialog/Dialog";
import InputFile from "@app_component/base/input/file/InputFile";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {TemplatePermissions} from "@entity/template/constants";
import {Template} from "@root/classes/Template";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";

const ImportTemplateButton: FC<ImportTemplateButtonProps> =
    ({
        autoFocus,
    }) => {
    const dispatch = useAppDispatch();
    const {checkingTemplateId, isCurrentTemplateHasUniqueId} = Template.getReduxState();
    const [startImporting, setStartImporting] = useState<boolean>(false);
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [showConfirmation, toggleConfirmation] = useState<boolean>(false);
    const toggleDialog = () => {
        setShowDialog(!showDialog);
        setStartImporting(false);
    };
    const [templateFile, setTemplateFile] = useState<any>(null);
    const onChangeImportTemplateFile = (newFile: any) => {
        if(newFile){
            setTemplateFile(newFile);
        }
    }
    const importFile = () => {
        setStartImporting(false);
        if(templateFile) {
            dispatch(importTemplate(templateFile))
        }
        toggleDialog();
        setTemplateFile(null);

    }
    useEffect(() => {
        if (checkingTemplateId === API_REQUEST_STATE.FINISH) {
            if (isCurrentTemplateHasUniqueId === TRIPLET_STATE.TRUE) {
                toggleConfirmation(true);
            } else {
                importFile();
            }
        }
    }, [checkingTemplateId])
    useEffect(() => {
        if (startImporting) {
            console.log(templateFile);
            dispatch(checkTemplateId(templateFile.name.toString().substr(0, templateFile.name.length - 5)));
        }
    }, [startImporting]);
    return (
        <ImportTemplateButtonStyled >
            <PermissionButton autoFocus={autoFocus} size={TextSize.Size_16} key={'add_button'} icon={'add'} handleClick={toggleDialog} label={'Import Template'} permission={TemplatePermissions.CREATE}/>
            <Dialog
                actions={[
                    {id: 'import_ok', label: 'Ok', onClick: () => setStartImporting(true)},
                    {id: 'import_cancel', label: 'Cancel', onClick: toggleDialog}]}
                title={'Import Template'} active={showDialog} toggle={toggleDialog}>
                <InputFile
                    id={'import_file'}
                    icon={'upload'}
                    hasCheckbox={false}
                    hasNoImage={false}
                    // @ts-ignore
                    onChange={(f) => onChangeImportTemplateFile(f)}
                    // @ts-ignore
                    value={templateFile}
                    accept={'application/JSON,application/zip'}
                    hasCrop={false}
                />
            </Dialog>
            <Confirmation
                okClick={() => {
                    toggleConfirmation(false);
                    importFile();
                }}
                cancelClick={() => {
                    setStartImporting(false);
                    toggleConfirmation(false);
                }}
                active={showConfirmation}
                title={'Confirmation'}
                message={'The template with such id already exists. It will be replaced. Are you agree?'}
            />
        </ImportTemplateButtonStyled>
    )
}

ImportTemplateButton.defaultProps = {
}


export {
    ImportTemplateButton,
};

export default withTheme(ImportTemplateButton);
