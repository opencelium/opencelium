import React, {useState} from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";
import {MockLogs} from "./connection_logs_mock";

const FakeConnectionLogs = () => {
    const [isDisabled, toggleDisabled] = useState<boolean>(false);
    const getFirstLevelLogs = (index: number) => {
        mockSocket.emit("connection-log", MockLogs[index]);
        setTimeout(() => {
            if (index < MockLogs.length - 1) {
                getFirstLevelLogs(index + 1)
            } else {
                toggleDisabled(false)
            }
        }, 1000)
        toggleDisabled(true);
    };

    return (
        <div>
            <h6 style={{textAlign: 'center'}}>
                Connection Logs
            </h6>
            <div>
                <Button disabled={isDisabled} onClick={() => getFirstLevelLogs(0)}>Get first level logs</Button>
            </div>
        </div>
    );
};

export default FakeConnectionLogs;
