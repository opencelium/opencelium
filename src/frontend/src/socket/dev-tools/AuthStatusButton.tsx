import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";

const FakeAuthStatus = () => {
    const fakeLogin = () => {
        mockSocket.emit("auth-status", true);
    };
    const fakeLogout = () => {
        mockSocket.emit("auth-status", false);
    };

    return (
        <div>
            <h6>
                Auth
            </h6>
            <div style={{display: 'flex', gap: 10}}>
                <Button onClick={fakeLogin}>Login</Button>
                <Button onClick={fakeLogout}>Logout</Button>
            </div>
        </div>
    );
};

export default FakeAuthStatus;
