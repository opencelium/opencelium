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
import {withTheme} from 'styled-components';
import {useAppDispatch} from "@application/utils/store";
import InputFile from "@app_component/base/input/file/InputFile";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import Dialog from "@app_component/base/dialog/Dialog";
import {importInvoker} from "../../redux_toolkit/action_creators/InvokerCreators";
import {InvokerPermissions} from "../../constants";
import { ImportInvokerButtonProps } from './interfaces';
import { ImportInvokerButtonStyled } from './styles';

const ImportInvokerButton: FC<ImportInvokerButtonProps> =
    ({
        
    }) => {
    const dispatch = useAppDispatch();
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const toggleDialog = () => {setShowDialog(!showDialog)};
    const [invokerFile, setInvokerFile] = useState<any>(null);
    const onChangeImportInvokerFile = (newFile: any) => {
        if(newFile){
            setInvokerFile(newFile);
        }
    }
    const importFile = () => {
        if(invokerFile) {
            dispatch(importInvoker(invokerFile))
        }
        toggleDialog();
        setInvokerFile(null);
    }
    return (
        <ImportInvokerButtonStyled >
            <PermissionButton size={TextSize.Size_16} key={'add_button'} icon={'add'} handleClick={toggleDialog} label={'Import Invoker'} permission={InvokerPermissions.CREATE}/>
            <Dialog
                actions={[
                    {id: 'import_ok', label: 'Ok', onClick: importFile},
                    {id: 'import_cancel', label: 'Cancel', onClick: toggleDialog}]}
                title={'Import Invoker'} active={showDialog} toggle={toggleDialog}>
                <InputFile
                    id={'import_file'}
                    icon={'upload'}
                    hasCheckbox={false}
                    hasNoImage={false}
                    // @ts-ignore
                    onChange={(f) => onChangeImportInvokerFile(f)}
                    // @ts-ignore
                    value={invokerFile}
                    accept={'text/xml'}
                    hasCrop={false}
                />
            </Dialog>
        </ImportInvokerButtonStyled>
    )
}

ImportInvokerButton.defaultProps = {
}


export {
    ImportInvokerButton,
};

export default withTheme(ImportInvokerButton);