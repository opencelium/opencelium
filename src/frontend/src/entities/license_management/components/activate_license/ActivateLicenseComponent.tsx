import React, {ChangeEvent, useEffect, useMemo, useState} from 'react';
import Button from "@app_component/base/button/Button";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import License from "@entity/license_management/classes/License";
import {ActivateLicenseForm} from "@entity/license_management/classes/ActivateLicenseForm";
import {IActivateLicenseForm, UploadType} from "@entity/license_management/interfaces/IActivateLicenseForm";
import Dialog from "@basic_components/Dialog";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {
    setCurrentSubscription
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {useAppDispatch} from "@application/utils/store";
import Subscription from "@entity/license_management/classes/Subscription";
import {
    getLicenseList,
    getLicenseStatus
} from "@entity/license_management/redux_toolkit/action_creators/LicenseCreators";

const ActivateLicenseComponent = () => {
    const dispatch = useAppDispatch();
    const {gettingCurrentSubscription} = Subscription.getReduxState();
    const {gettingLicenseList, licenseList, gettingLicenseStatus, status} = License.getReduxState();
    const [selectedSubscription, setSelectedSubscription] = useState<any>();
    const licenseOptions = useMemo(() => {
        return License.getOptions(licenseList);
    }, [licenseList]);
    const {activatingLicense} = License.getReduxState();
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const UploadTokenForm = ActivateLicenseForm.createState<IActivateLicenseForm>();
    useEffect(() => {
        if (gettingLicenseStatus === API_REQUEST_STATE.FINISH) {
            if (status === TRIPLET_STATE.TRUE) {
                dispatch(getLicenseList());
            }
        }
    }, [gettingLicenseStatus]);
    const activate = () => {
        dispatch(setCurrentSubscription(selectedSubscription.value))
    }
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
                    {id: 'download', label: 'Activate', onClick: activate, isLoading: activatingLicense === API_REQUEST_STATE.START},
                    {id: 'cancel', label: 'Cancel', onClick: () => toggleDialog(false)}]}
                title={'Activate License'}
                active={showDialog}
                toggle={() => toggleDialog(!showDialog)}
            >
                <InputSelect
                    isLoading={gettingLicenseList === API_REQUEST_STATE.START || gettingCurrentSubscription === API_REQUEST_STATE.START}
                    icon={'local_police'}
                    label={'Subscriptions'}
                    options={licenseOptions}
                    value={selectedSubscription}
                    onChange={setSelectedSubscription}
                />
            </Dialog>
            <Button
                size={14}
                label={'Activate License'}
                icon={'cloud_sync'}
                handleClick={() => toggleDialog(true)}
                isDisabled={status !== TRIPLET_STATE.TRUE}
                title={'Please, check your settings.'}
                isLoading={activatingLicense === API_REQUEST_STATE.START}
            />
        </div>
    )
}

export default ActivateLicenseComponent;
