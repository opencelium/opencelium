import React from "react";
import { Button } from "reactstrap";
import {mockSocket} from "../MockOpenceliumSocket";

const FakeCurrentSubscription = () => {
    const fakeHasSubscription = () => {
        mockSocket.emit("current-subscription", true);
    };
    const fakeHasExpiredSubscription = () => {
        mockSocket.emit("current-subscription", false);
    };
    const fakeHasNoSubscription = () => {
        mockSocket.emit("current-subscription", false);
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
