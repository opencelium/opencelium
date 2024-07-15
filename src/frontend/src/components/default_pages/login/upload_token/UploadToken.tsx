import React, {useEffect} from 'react';
import FormComponent from "@app_component/form/form/Form";
import Button from "@basic_components/buttons/Button";
import {UploadToken} from "@application/classes/UploadToken";
import {IUploadTokenForm, UploadType} from "@application/interfaces/IUploadToken";
import {FormSection} from "@app_component/form/form_section/FormSection";
import {Auth} from "@application/classes/Auth";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const UploadTokenComponent = () => {
    const {uploadingToken} = Auth.getReduxState();
    const UploadTokenForm = UploadToken.createState<IUploadTokenForm>();
    const Type = UploadTokenForm.getRadios({propertyName: "type", props: {
        icon: 'call_merge',
        label: 'Upload as',
        options: [{autoFocus: true, label: 'Text', value: UploadType.String, checked: true, key: UploadType.String}, {label: 'File', value: UploadType.File, checked: false, key: UploadType.File}],
    }})
    const TokenText = UploadTokenForm.getTextarea({propertyName: "token", props: {
        icon: 'lock_outline',
        label: 'Token',
        minHeight: '115px'
    }})
    const TokenFile = UploadTokenForm.getFile({propertyName: "tokenFile", props: {
        label: 'Token',
        icon: 'lock_outline',
        hasNoImage: false,
        hasCrop: false,
        buttonProps: {label: '', iconSize: '18px'},
    }})
    const upload = () => {
        UploadTokenForm.upload();
    }
    const data = {
        formSections: [
            <FormSection label={{value: 'Upload Token'}} hasFullWidthInForm>
                {Type}
                {UploadTokenForm.type === UploadType.String && TokenText}
                {UploadTokenForm.type === UploadType.File && TokenFile}
                <div style={{float: 'right'}}>
                    <Button
                        key={'upload'}
                        label={'Upload'}
                        handleClick={upload}
                        isLoading={uploadingToken === API_REQUEST_STATE.START}
                    />
                </div>
            </FormSection>
        ]
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
        <FormComponent {...data}/>
    )
}

export default UploadTokenComponent;
