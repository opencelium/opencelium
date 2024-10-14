import React, {useEffect} from 'react';
import {Alert} from "reactstrap";
import {Link} from "react-router-dom";
import OperationalUsageLimitMessage from "@entity/schedule/components/pages/OperationalUsageLimitMessage";
import Subscription from "@entity/license_management/classes/Subscription";
import {getCurrentSubscription} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const LicenseAlertMessage = () => {
    const dispatch = useAppDispatch();
    const {currentSubscription, gettingCurrentSubscription} = Subscription.getReduxState();
    const hasApiLimit = !currentSubscription || (currentSubscription.totalOperationUsage !== 0 && currentSubscription.currentOperationUsage >= currentSubscription.totalOperationUsage);
    useEffect(() => {
        dispatch(getCurrentSubscription())
    }, [])
    if (gettingCurrentSubscription !== API_REQUEST_STATE.FINISH) {
        return null;
    }
    if (!currentSubscription) {
        return (
            <Alert color="danger" style={{marginTop: 20, marginBottom: 0}}>
                {"Your OpenCelium is currently not licensed. Please, click "}
                <Link to={'/license_management'} title={'License Management'}>{"here"}</Link>
                {" to activate it."}
            </Alert>
        )
    }
    if (hasApiLimit) {
        return (
            <Alert color="danger" style={{marginTop: 20, marginBottom: 0}}>
                {"You have reached the subscription limit of api calls. Please, click "}
                <Link to={'/license_management'} title={'License Management'}>{"here"}</Link>
                {" to see in details."}
            </Alert>
        )
    }
    return null;
}

export default LicenseAlertMessage;
