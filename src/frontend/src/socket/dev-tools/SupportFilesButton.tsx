import React from "react";
import {mockSocket} from "../MockOpenceliumSocket";
import {Button} from "reactstrap";

const FakeSupportFiles = () => {
    const fakeFinishedGeneration = () => {
        mockSocket.emit("support-files", true);
    };

    return (
        <div>
            <h6 style={{textAlign: 'center'}}>
                Support files
            </h6>
            <div>
                <Button onClick={fakeFinishedGeneration}>Generated new</Button>
            </div>
        </div>
    );
};

export default FakeSupportFiles;
