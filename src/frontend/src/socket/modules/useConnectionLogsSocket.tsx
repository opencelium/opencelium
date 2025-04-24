import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import {ConnectionSocketLog} from "@root/requests/models/ConnectionLog";
import {useAppDispatch} from "@application/utils/store";
import {addSocketLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";

export const useConnectionLogsSocket = (socket: Socket | null) => {
    const dispatch = useAppDispatch();
    const [connectionLog, setConnectionLog] = useState<ConnectionSocketLog | undefined>(undefined);

    useEffect(() => {
        console.log(connectionLog);
        if (connectionLog) {
            dispatch(addSocketLog(connectionLog));
            setConnectionLog(undefined);
        }
    }, [connectionLog]);

    useEffect(() => {
        if (!socket) return;
        const handleLog = (log: ConnectionSocketLog) => {
            setConnectionLog(log);
        }
        socket.on("connection-log", handleLog);
        return () => {
            socket.off("connection-log", handleLog);
        };
    }, [socket]);

    return { connectionLog };
};
