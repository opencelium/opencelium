import React, {ChangeEvent, useEffect, useState} from 'react';
import Button from "@app_component/base/button/Button";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import License from "@entity/license_management/classes/License";
import {ActivateLicenseForm} from "@entity/license_management/classes/ActivateLicenseForm";
import {IActivateLicenseForm, UploadType} from "@entity/license_management/interfaces/IActivateLicenseForm";
import Dialog from "@basic_components/Dialog";

const ImportLicenseComponent = () => {
    const {activatingLicense, generatingActivateRequest} = License.getReduxState();
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const UploadTokenForm = ActivateLicenseForm.createState<IActivateLicenseForm>();
    const TokenFile = UploadTokenForm.getFile({propertyName: "tokenFile", props: {
        label: 'Key',
        icon: 'lock_outline',
        hasNoImage: false,
        hasCrop: false,
        accept: '.txt',
        buttonProps: {label: '', iconSize: '18px'},
    }})
    const upload = () => {
        switch (UploadTokenForm.type) {
            case UploadType.File:
                UploadTokenForm.activateFile();
                break;
        }
    }
    useEffect(() => {
        if (activatingLicense === API_REQUEST_STATE.FINISH) {
            toggleDialog(false);
        }
    }, [activatingLicense])
    useEffect(() => {
        switch (UploadTokenForm.type) {
            case UploadType.File:
                //@ts-ignore
                UploadTokenForm.updateToken(UploadTokenForm, '');
                break
        }
    }, [UploadTokenForm.type]);
    return (
        <div style={{display: 'inline-block'}}>
            <Dialog
                actions={[
                    {id: 'import', label: 'Import', onClick: upload, isLoading: activatingLicense === API_REQUEST_STATE.START},
                    {id: 'cancel', label: 'Cancel', onClick: () => toggleDialog(false)}]}
                title={'Import License'} active={showDialog} toggle={() => toggleDialog(!showDialog)}>
                {TokenFile}
            </Dialog>
            <Button
                label={'Import License'}
                icon={'file_upload'}
                handleClick={() => toggleDialog(true)}
                isLoading={generatingActivateRequest === API_REQUEST_STATE.START}
            />
        </div>
    )
}

export default ImportLicenseComponent;
