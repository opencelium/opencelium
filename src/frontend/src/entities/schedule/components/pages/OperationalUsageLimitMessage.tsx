import React from 'react';
import {Alert} from "reactstrap";
import {Link} from "react-router-dom";

const OperationalUsageLimitMessage = () => {
    return (
        <Alert color="danger" style={{marginTop: 20, marginBottom: 0}}>
            {"You have reached the subscription limit of api calls. Please, click "}
            <Link to={'/license_management'} title={'License Management'}>{"here"}</Link>
            {" to see in details."}
        </Alert>
    )
}

export default OperationalUsageLimitMessage;
