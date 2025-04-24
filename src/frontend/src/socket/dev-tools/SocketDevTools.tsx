import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import FakeAuthStatus from "./AuthStatusButton";
import FakeCurrentSchedules from "./CurrentSchedulesButton";
import FakeConnectionLogs from "./ConnectionLogsButton";
import FakeSupportFiles from "./SupportFilesButton";
import FakeServerConnection from "./ServerConnectionButton";
import FakeCurrentSubscription from "./CurrentSubscriptionButton";
import styled from "styled-components";

const DevTools = () => {
    return (
        <div>
            <h2 style={{textAlign: 'center'}}>
                Fake Socket Events
            </h2>
            <DevToolsContainer>
                <FakeServerConnection/>
                <FakeAuthStatus/>
                <FakeCurrentSubscription/>
                <FakeCurrentSchedules/>
                <FakeConnectionLogs/>
                <FakeSupportFiles/>
            </DevToolsContainer>
        </div>
    );
};

const DevToolsContainer = styled.div`
    display: flex;
    gap: 10px;

    > :nth-child(odd) {
        border: 1px solid #eee;
        padding: 10px;
    }
    > :nth-child(even) {
        border: 1px solid #eee;
        padding: 10px;
    }

`;
export default DevTools;
