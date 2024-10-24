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

import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import { ImportTemplateButtonProps } from './interfaces';
import { ImportTemplateButtonStyled } from './styles';
import {useAppDispatch} from "@application/utils/store";
import {importTemplate} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import Dialog from "@app_component/base/dialog/Dialog";
import InputFile from "@app_component/base/input/file/InputFile";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import {TemplatePermissions} from "@entity/template/constants";

const ImportTemplateButton: FC<ImportTemplateButtonProps> =
    ({
        autoFocus,
    }) => {
    const dispatch = useAppDispatch();
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const toggleDialog = () => {setShowDialog(!showDialog)};
    const [templateFile, setTemplateFile] = useState<any>(null);
    const onChangeImportTemplateFile = (newFile: any) => {
        if(newFile){
            setTemplateFile(newFile);
        }
    }
    const importFile = () => {
        if(templateFile) {
            dispatch(importTemplate(templateFile))
        }
        toggleDialog();
        setTemplateFile(null);
    }
    return (
        <ImportTemplateButtonStyled >
            <PermissionButton autoFocus={autoFocus} size={TextSize.Size_16} key={'add_button'} icon={'add'} handleClick={toggleDialog} label={'Import Template'} permission={TemplatePermissions.CREATE}/>
            <Dialog
                actions={[
                    {id: 'import_ok', label: 'Ok', onClick: importFile},
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
        </ImportTemplateButtonStyled>
    )
}

ImportTemplateButton.defaultProps = {
}


export {
    ImportTemplateButton,
};

export default withTheme(ImportTemplateButton);