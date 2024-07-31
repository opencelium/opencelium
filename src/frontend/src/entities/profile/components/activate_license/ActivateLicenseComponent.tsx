import React, {useEffect} from 'react';
import Button from "@basic_components/buttons/Button";
import {FormSection} from "@app_component/form/form_section/FormSection";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import License from "@entity/application/classes/License";
import {ActivateLicenseForm} from "@entity/application/classes/ActivateLicenseForm";
import {IActivateLicenseForm, UploadType} from "@entity/application/interfaces/IActivateLicenseForm";

const ActivateLicenseComponent = () => {
    const {activatingLicense} = License.getReduxState();
    const UploadTokenForm = ActivateLicenseForm.createState<IActivateLicenseForm>();
    const Type = UploadTokenForm.getRadios({propertyName: "type", props: {
        icon: 'call_merge',
        label: 'Upload as',
        options: [{autoFocus: true, label: 'Text', value: UploadType.String, checked: true, key: UploadType.String}, {label: 'File', value: UploadType.File, checked: false, key: UploadType.File}],
    }})
    const TokenText = UploadTokenForm.getTextarea({propertyName: "token", props: {
        icon: 'lock_outline',
        label: 'Key',
        minHeight: '115px'
    }})
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
            {Type}
            {UploadTokenForm.type === UploadType.String && TokenText}
            {UploadTokenForm.type === UploadType.File && TokenFile}
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
