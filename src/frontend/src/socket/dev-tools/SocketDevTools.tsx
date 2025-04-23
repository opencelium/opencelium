import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import FakeAuthStatus from "./AuthStatusButton";
import FakeCurrentSchedules from "./CurrentSchedulesButton";
import FakeConnectionLogs from "./ConnectionLogsButton";
import FakeSupportFiles from "./SupportFilesButton";
import FakeServerConnection from "./ServerConnectionButton";
import FakeCurrentSubscription from "./CurrentSubscriptionButton";

const DevTools = () => {
    return (
        <div>
            <h2>
                Fake Socket Events
            </h2>
            <div style={{display: 'flex', gap: 10}}>
                <FakeServerConnection/>
                <FakeAuthStatus/>
                <FakeCurrentSubscription/>
                <FakeCurrentSchedules/>
                <FakeConnectionLogs/>
                <FakeSupportFiles/>
            </div>
        </div>
    );
};

export default DevTools;
