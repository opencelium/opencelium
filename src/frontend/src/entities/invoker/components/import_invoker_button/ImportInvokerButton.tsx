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
import {useAppDispatch} from "@application/utils/store";
import InputFile from "@app_component/base/input/file/InputFile";
import {PermissionButton} from "@app_component/base/button/PermissionButton";
import {TextSize} from "@app_component/base/text/interfaces";
import Dialog from "@app_component/base/dialog/Dialog";
import {checkInvokerFileName, importInvoker} from "../../redux_toolkit/action_creators/InvokerCreators";
import {InvokerPermissions} from "../../constants";
import { ImportInvokerButtonProps } from './interfaces';
import { ImportInvokerButtonStyled } from './styles';
import { Invoker } from '@entity/invoker/classes/Invoker';
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";

const ImportInvokerButton: FC<ImportInvokerButtonProps> =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {checkingInvokerFilename, isCurrentInvokerHasUniqueFilename} = Invoker.getReduxState();
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [showConfirm, setShowConfirm] = useState<boolean>(false);
    const toggleDialog = () => {setShowDialog(!showDialog)};
    const [invokerFile, setInvokerFile] = useState<any>(null);
    const [startCheckingFilename, setStartCheckingFilename] = useState<boolean>(false);
    const onChangeImportInvokerFile = (newFile: any) => {
        if(newFile){
            setInvokerFile(newFile);
        }
    }
    const checkFilename = () => {
        dispatch(checkInvokerFileName(invokerFile.name));
        setStartCheckingFilename(true);
    }
    useEffect(() => {
        if(startCheckingFilename) {
            if (checkingInvokerFilename === API_REQUEST_STATE.FINISH) {
                if(isCurrentInvokerHasUniqueFilename === TRIPLET_STATE.TRUE){
                    importFile();
                } else{
                    setShowConfirm(true);
                }
                setStartCheckingFilename(false);
            }
        }
    }, [checkingInvokerFilename])
    const importFile = () => {
        if(showConfirm){
            setShowConfirm(false);
        }
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
                    {id: 'import_ok', label: 'Ok', onClick: checkFilename},
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
                    accept={'text/xml,application/zip'}
                    hasCrop={false}
                />
            </Dialog>
            <Confirmation
                okClick={importFile}
                cancelClick={() => setShowConfirm(false)}
                active={showConfirm}
                title={'Confirmation'}
                message={'The invoker with such filename already exists. It will be replaced. Are you sure?'}
            />
        </ImportInvokerButtonStyled>
    )
}

ImportInvokerButton.defaultProps = {
}


export {
    ImportInvokerButton,
};

export default withTheme(ImportInvokerButton);
