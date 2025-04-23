import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";

const FakeCurrentSchedules = () => {
    const fakeZeroSchedules = () => {
        mockSocket.emit("current-schedules", true);
    };
    const fakeOneSchedule = () => {
        mockSocket.emit("current-schedules", false);
    };

    return (
        <div>
            <h6>Current Schedules</h6>
            <div style={{display: 'flex', gap: 10}}>
                <Button onClick={fakeZeroSchedules}>has 0 schedules</Button>
                <Button onClick={fakeOneSchedule}>has 1 schedule</Button>
            </div>
        </div>
    );
};

export default FakeCurrentSchedules;
