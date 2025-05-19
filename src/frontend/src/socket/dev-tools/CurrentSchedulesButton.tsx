import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";

const FakeCurrentSchedules = () => {
    const fakeZeroSchedules = () => {
        mockSocket.emit("current-schedules", []);
    };
    const fakeOneSchedule = () => {
        mockSocket.emit("current-schedules", [{
            schedulerId: 0,
            title: 'new schedule',
            avgDuration: 10000,
            fromConnector: 'from connector',
            toConnector: 'to connector'
        }]);
    };

    return (
        <div>
            <h6 style={{textAlign: 'center'}}>Current Schedules</h6>
            <div style={{display: 'flex', gap: 10}}>
                <Button onClick={fakeZeroSchedules}>has 0 schedules</Button>
                <Button onClick={fakeOneSchedule}>has 1 schedule</Button>
            </div>
        </div>
    );
};

export default FakeCurrentSchedules;
