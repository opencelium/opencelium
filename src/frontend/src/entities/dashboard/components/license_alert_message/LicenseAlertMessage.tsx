import React from 'react';
import {Alert} from "reactstrap";
import {Link} from "react-router-dom";
import Subscription from "@entity/license_management/classes/Subscription";
import {useSocketData} from "../../../../socket/SocketDataContext";

const LicenseAlertMessage = () => {
    const {currentSubscription} = useSocketData();
    const hasApiLimit = Subscription.hasReachedLimit(currentSubscription);
    if (currentSubscription === null) {
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
