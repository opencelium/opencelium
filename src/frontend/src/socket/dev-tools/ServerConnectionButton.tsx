import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";

const FakeServerConnection = () => {
    const fakeConnect = () => {
        mockSocket.connect();
    };
    const fakeDisconnect = () => {
        mockSocket.disconnect();
    };

    return (
        <div>
            <h6>
                Server Connection
            </h6>
            <div style={{display: 'flex', gap: 10}}>
                <Button onClick={fakeConnect}>Connect</Button>
                <Button onClick={fakeDisconnect}>Disconnect</Button>
            </div>
        </div>
    );
};

export default FakeServerConnection;
