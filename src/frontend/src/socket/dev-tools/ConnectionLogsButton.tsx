import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";

const FakeConnectionLogs = () => {
    const getFirstLevelLogs = () => {
        mockSocket.emit("connection-logs", true);
    };

    return (
        <div>
            <h6>
                Connection Logs
            </h6>
            <div>
                <Button onClick={getFirstLevelLogs}>Get first level logs</Button>
            </div>
        </div>
    );
};

export default FakeConnectionLogs;
