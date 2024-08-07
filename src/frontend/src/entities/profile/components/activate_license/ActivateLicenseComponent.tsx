import React, {useEffect} from 'react';
import Button from "@basic_components/buttons/Button";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import License from "@entity/application/classes/License";
import {ActivateLicenseForm} from "@entity/application/classes/ActivateLicenseForm";
import {IActivateLicenseForm, UploadType} from "@entity/application/interfaces/IActivateLicenseForm";

const ActivateLicenseComponent = () => {
    const {activatingLicense} = License.getReduxState();
    const UploadTokenForm = ActivateLicenseForm.createState<IActivateLicenseForm>();
    const TokenFile = UploadTokenForm.getFile({propertyName: "tokenFile", props: {
        label: 'Key',
        icon: 'lock_outline',
        hasNoImage: false,
        hasCrop: false,
        buttonProps: {label: '', iconSize: '18px'},
    }})
    const upload = () => {
        switch (UploadTokenForm.type) {
            case UploadType.String:
                UploadTokenForm.activateString();
                break;
            case UploadType.File:
                UploadTokenForm.activateFile();
                break;
        }
    }
    useEffect(() => {
        switch (UploadTokenForm.type) {
            case UploadType.String:
                //@ts-ignore
                UploadTokenForm.updateTokenFile(UploadTokenForm, null);
                break;
            case UploadType.File:
                //@ts-ignore
                UploadTokenForm.updateToken(UploadTokenForm, '');
                break
        }
    }, [UploadTokenForm.type]);
    return (
        <div>
            {TokenFile}
            <div style={{float: 'right'}}>
                <Button
                    label={'Activate'}
                    handleClick={upload}
                    isLoading={activatingLicense === API_REQUEST_STATE.START}
                />
            </div>
        </div>
    )
}

export default ActivateLicenseComponent;
