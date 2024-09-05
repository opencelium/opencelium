import React, {ChangeEvent, useEffect, useMemo, useState} from 'react';
import Button from "@basic_components/buttons/Button";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import License from "@entity/license_management/classes/License";
import {ActivateLicenseForm} from "@entity/license_management/classes/ActivateLicenseForm";
import {IActivateLicenseForm, UploadType} from "@entity/license_management/interfaces/IActivateLicenseForm";
import Dialog from "@basic_components/Dialog";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {
    getAllSubscriptions,
    getCurrentSubscription, setCurrentSubscription
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {useAppDispatch} from "@application/utils/store";
import Subscription from "@entity/license_management/classes/Subscription";

const ActivateLicenseComponent = () => {
    const dispatch = useAppDispatch();
    const {
        gettingSubscriptions, subscriptions, currentSubscription,
        gettingCurrentSubscription,
    } = Subscription.getReduxState();
    const [selectedSubscription, setSelectedSubscription] = useState<any>();
    const subscriptionOptions = useMemo(() => {
        return Subscription.getOptions(subscriptions);
    }, [subscriptions]);
    const {activatingLicense} = License.getReduxState();
    const [showDialog, toggleDialog] = useState<boolean>(false);
    const UploadTokenForm = ActivateLicenseForm.createState<IActivateLicenseForm>();
    const TokenFile = UploadTokenForm.getFile({propertyName: "tokenFile", props: {
        label: 'Key',
        icon: 'lock_outline',
        hasNoImage: false,
        hasCrop: false,
        buttonProps: {label: '', iconSize: '18px'},
    }})
    useEffect(() => {
        dispatch(getAllSubscriptions());
    }, [])
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
                    isLoading={gettingSubscriptions === API_REQUEST_STATE.START || gettingCurrentSubscription === API_REQUEST_STATE.START}
                    icon={'local_police'}
                    label={'Subscriptions'}
                    options={subscriptionOptions}
                    value={selectedSubscription}
                    onChange={setSelectedSubscription}
                />
            </Dialog>
            <Button
                size={14}
                label={'Activate License'}
                icon={'cloud_sync'}
                handleClick={() => toggleDialog(true)}
                isLoading={activatingLicense === API_REQUEST_STATE.START}
            />
        </div>
    )
}

export default ActivateLicenseComponent;
