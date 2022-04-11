import ModelSchedule from "./Schedule";

export default interface Schedules extends ModelSchedule{
    connection: {
        connectionId: number;
        description: string;
        fromConnector: {
            connectorId: number;
            title: string;
        },
        title: string;
        toConnector: {
            connectorId: number;
            title: string;
        }
    },
    lastExecution: any,
    notification: any[],
}