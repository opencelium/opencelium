import React, {useEffect, useMemo, useState} from 'react';
import InputSelect from "@app_component/base/input/select/InputSelect";
import Subscription from "@entity/application/classes/Subscription";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import Button from "@basic_components/buttons/Button";
import License from "@entity/application/classes/License";
import {useAppDispatch} from "@application/utils/store";
import {
    generateActivateRequest,
} from "@entity/application/redux_toolkit/action_creators/LicenseCreators";
import {
    getAllSubscriptions,
    getCurrentSubscription, setCurrentSubscription
} from "@entity/application/redux_toolkit/action_creators/SubscriptionCreators";
import CurrentSubscription from "@entity/profile/components/subscriptions/CurrentSubscription";

const SubscriptionsComponent = ({hasOnlineSync}: {hasOnlineSync: boolean}) => {
    const dispatch = useAppDispatch();
    const {generatingActivateRequest, activationRequestStatus} = License.getReduxState();
    const {
        gettingSubscriptions, subscriptions, currentSubscriptionId,
        gettingCurrentSubscription,
    } = Subscription.getReduxState();
    const [selectedSubscription, setSelectedSubscription] = useState<any>();
    const subscriptionOptions = useMemo(() => {
        return Subscription.getOptions(subscriptions);
    }, [subscriptions]);
    const currentSubscription = useMemo(() => {
        return subscriptions.find(s => s._id === currentSubscriptionId);
    }, [currentSubscriptionId]);
    useEffect(() => {
        dispatch(getAllSubscriptions());
        dispatch(getCurrentSubscription());
    }, [])
    useEffect(() => {
        if (gettingSubscriptions === API_REQUEST_STATE.FINISH && gettingCurrentSubscription === API_REQUEST_STATE.FINISH) {
            setSelectedSubscription(subscriptionOptions.find(s => s.value === currentSubscriptionId));
        }
    }, [gettingSubscriptions, gettingCurrentSubscription]);
    useEffect(() => {
        if (selectedSubscription && currentSubscriptionId !== selectedSubscription.value) {
            dispatch(setCurrentSubscription(selectedSubscription.value))
        }
    }, [selectedSubscription]);
    return (
        <div style={{position: 'relative'}}>
            {!hasOnlineSync && subscriptionOptions.length === 0 ? null : <InputSelect
                isLoading={gettingSubscriptions === API_REQUEST_STATE.START || gettingCurrentSubscription === API_REQUEST_STATE.START}
                icon={'local_police'}
                label={'Subscriptions'}
                options={subscriptionOptions}
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
