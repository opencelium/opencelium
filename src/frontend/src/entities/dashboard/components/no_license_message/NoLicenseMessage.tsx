import React from 'react';
import {Alert} from "reactstrap";
import {Link} from "react-router-dom";

const NoLicenseMessage = () => {
    return (
        <Alert color="danger" style={{marginLeft: 20, marginRight: 20, marginBottom: 0}}>
            {"Your OpenCelium is currently not licensed. Please, click "}
            <Link to={'/license_management'} title={'License Management'}>{"here"}</Link>
            {" to activate it."}
        </Alert>
    )
}

export default NoLicenseMessage;
