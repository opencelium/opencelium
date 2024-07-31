import React, {useMemo, useState} from 'react';
import InputSelect from "@app_component/base/input/select/InputSelect";
import Subscription from "@entity/application/classes/Subscription";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const SubscriptionsComponent = (props: {}) => {
    const {gettingSubscriptions, subscriptions} = Subscription.getReduxState();
    const [currentSubscription, setCurrentSubscription] = useState<any>();
    const subscriptionOptions = useMemo(() => {
        return Subscription.getOptions(subscriptions);
    }, [subscriptions]);
    const changeSubscription = () => {

    }
    return (
        <div style={{position: 'relative'}}>
            <InputSelect
                isLoading={gettingSubscriptions === API_REQUEST_STATE.START}
                icon={'local_police'}
                label={'Subscriptions'}
                options={subscriptionOptions}
                value={currentSubscription}
                onChange={setCurrentSubscription}
            />
        </div>
    )
}

export default SubscriptionsComponent;
