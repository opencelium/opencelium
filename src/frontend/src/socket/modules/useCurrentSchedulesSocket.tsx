import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";

export const useCurrentSchedulesSocket = (socket: Socket | null) => {
    const [currentSchedules, setCurrentSchedules] = useState<ModelCurrentSchedule[]>([]);

    useEffect(() => {
        if (!socket) return;
        const handleSchedules = (schedules: ModelCurrentSchedule[]) => setCurrentSchedules(schedules);
        socket.on("current-schedules", handleSchedules);
        return () => {
            socket.off("current-schedules", handleSchedules);
        };
    }, [socket]);

    return { currentSchedules };
};
