import React, {useEffect} from 'react';
import {Alert} from "reactstrap";
import {Link} from "react-router-dom";
import Subscription from "@entity/license_management/classes/Subscription";
import {
    getCurrentSubscriptionOnlyForSchedules
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {useAppDispatch} from "@application/utils/store";

const LicenseAlertMessageForSchedules = () => {
    const dispatch = useAppDispatch();
    const {currentSubscriptionOnlyForSchedules, gettingCurrentSubscriptionOnlyForSchedules} = Subscription.getReduxState();
    const hasApiLimitOnlyForSchedules = Subscription.hasReachedLimit(currentSubscriptionOnlyForSchedules);
    useEffect(() => {
        dispatch(getCurrentSubscriptionOnlyForSchedules())
    }, [])
    if (currentSubscriptionOnlyForSchedules === undefined) {
        return null;
    }
    if (!currentSubscriptionOnlyForSchedules) {
        return (
            <Alert color="danger" style={{marginTop: 20, marginBottom: 0}}>
                {"Your OpenCelium is currently not licensed. Please, click "}
                <Link to={'/license_management'} title={'License Management'}>{"here"}</Link>
                {" to activate it."}
            </Alert>
        )
    } else {
        if (!!currentSubscriptionOnlyForSchedules && hasApiLimitOnlyForSchedules) {
            return (
                <Alert color="danger" style={{marginTop: 20, marginBottom: 0}}>
                    {"You have reached the subscription limit of api calls. Please, click "}
                    <Link to={'/license_management'} title={'License Management'}>{"here"}</Link>
                    {" to see in details."}
                </Alert>
            )
        }
    }
    return null;
}

export default LicenseAlertMessageForSchedules;
