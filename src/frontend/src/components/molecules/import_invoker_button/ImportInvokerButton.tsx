import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import { ImportInvokerButtonProps } from './interfaces';
import { ImportInvokerButtonStyled } from './styles';
import {useAppDispatch} from "../../../hooks/redux";
import {importInvoker} from "@action/InvokerCreators";
import {Dialog} from "@atom/dialog/Dialog";
import InputFile from "@atom/input/file/InputFile";
import {InvokerPermissions} from "@constants/permissions";
import {PermissionButton} from "@atom/button/PermissionButton";
import {TextSize} from "@atom/text/interfaces";

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