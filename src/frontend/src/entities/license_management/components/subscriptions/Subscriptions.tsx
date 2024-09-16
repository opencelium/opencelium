import React, {useEffect, useMemo, useState} from 'react';
import InputSelect from "@app_component/base/input/select/InputSelect";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Button from "@basic_components/buttons/Button";
import {useAppDispatch} from "@application/utils/store";
import Subscription from "@entity/license_management/classes/Subscription";
import {
    getCurrentSubscription, setCurrentSubscription
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import CurrentSubscription from "@entity/license_management/components/subscriptions/CurrentSubscription";
import {
    generateActivateRequest,
    getLicenseList
} from "@entity/license_management/redux_toolkit/action_creators/LicenseCreators";
import License from "@entity/license_management/classes/License";

const SubscriptionsComponent = ({hasOnlineSync}: {hasOnlineSync: boolean}) => {
    const dispatch = useAppDispatch();
    const {
        currentSubscription,
        gettingCurrentSubscription,
    } = Subscription.getReduxState();
    const {gettingLicenseList, licenseList} = License.getReduxState();
    const [selectedSubscription, setSelectedSubscription] = useState<any>();
    const licenseOptions = useMemo(() => {
        return License.getOptions(licenseList);
    }, [licenseList]);
    useEffect(() => {
        dispatch(getLicenseList());
        dispatch(getCurrentSubscription());
    }, [])
    useEffect(() => {
        if (gettingLicenseList === API_REQUEST_STATE.FINISH && gettingCurrentSubscription === API_REQUEST_STATE.FINISH) {
            setSelectedSubscription(licenseOptions.find(s => s.value === currentSubscription._id));
        }
    }, [gettingLicenseList, gettingCurrentSubscription]);
    useEffect(() => {
        if (selectedSubscription && currentSubscription._id !== selectedSubscription.value) {
            dispatch(setCurrentSubscription(selectedSubscription.value))
        }
    }, [selectedSubscription]);
    return (
        <div style={{position: 'relative'}}>
            {!hasOnlineSync && licenseOptions.length === 0 ? null : <InputSelect
                isLoading={gettingLicenseList === API_REQUEST_STATE.START || gettingCurrentSubscription === API_REQUEST_STATE.START}
                icon={'local_police'}
                label={'Subscriptions'}
                options={licenseOptions}
                value={selectedSubscription}
                onChange={setSelectedSubscription}
            />
            }
            {currentSubscription && <div style={{margin: 20}}>
                <CurrentSubscription subscription={currentSubscription}/>
            </div>}
            {!hasOnlineSync && <div style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                marginLeft: '10px',
                marginTop: '20px',
            }}>
                <Button
                    title={'Generate Activation Request'}
                    onClick={() => dispatch(generateActivateRequest())}
                />
            </div>}
        </div>
    )
}

export default SubscriptionsComponent;
