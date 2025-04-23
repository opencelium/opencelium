import React from "react";
import { Button } from "reactstrap";
import {mockSocket} from "../MockOpenceliumSocket";

const FakeCurrentSubscription = () => {
    const fakeHasSubscription = () => {
        mockSocket.emit("current-subscription", {
            "subId": "66e981a1061e985b595b7505",
            "licenseId": "66e981a1061e985b595b7508",
            "type": "free",
            "startDate": 1640995200000,
            "endDate": 0,
            "duration": "-",
            "totalOperationUsage": 25000,
            "currentOperationUsage": 0,
            "active": true,
            "monthPeriod": {
                "startDate": 1743465600000,
                "endDate": 1746057599999
            },
            "extraOps": null
        });
    };
    const fakeHasExpiredSubscription = () => {
        mockSocket.emit("current-subscription", {
            "subId": "66e981a1061e985b595b7505",
            "licenseId": "66e981a1061e985b595b7508",
            "type": "free",
            "startDate": 1640995200000,
            "endDate": 0,
            "duration": "-",
            "totalOperationUsage": 25000,
            "currentOperationUsage": 25020,
            "active": true,
            "monthPeriod": {
                "startDate": 1743465600000,
                "endDate": 1746057599999
            },
            "extraOps": null
        });
    };
    const fakeHasNoSubscription = () => {
        mockSocket.emit("current-subscription", null);
    };

    return (
        <div>
            <h6>
                Current Subscription
            </h6>
            <div style={{display: 'flex', gap: 10}}>
                <Button onClick={fakeHasSubscription}>Has subscription</Button>
                <Button onClick={fakeHasExpiredSubscription}>Has expired subscription</Button>
                <Button onClick={fakeHasNoSubscription}>Has no subscription</Button>
            </div>
        </div>
    );
};

export default FakeCurrentSubscription;
