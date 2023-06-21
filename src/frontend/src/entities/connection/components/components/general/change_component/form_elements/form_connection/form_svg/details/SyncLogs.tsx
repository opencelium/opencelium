/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {FC, useEffect, useState} from "react";
import Socket, {Message} from "@application/classes/socket/Socket";
import {addCurrentLog, clearCurrentLogs} from "@root/redux_toolkit/slices/ConnectionSlice";
import { Auth } from "@application/classes/Auth";
import {useAppDispatch} from "@application/utils/store";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import { Connection } from "@entity/connection/classes/Connection";
import { Schedule } from "@entity/schedule/classes/Schedule";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/content/connection/CConnectorItem";

const SyncLogs: FC<{connection: CConnection, shouldClear?: boolean}> =
    ({
        shouldClear,
        connection,
    }) => {
        const dispatch = useAppDispatch();
        const {authUser} = Auth.getReduxState();
        const {testSchedule} = Schedule.getReduxState();
        const [socket, setSocket] = useState<Socket>(null);
        let hasStartedParsing = false;
        const saveLogs = (message: Message): void => {
            let connector = connection.fromConnector;
            const log = JSON.parse(message.body.toString());
            let parsedMessage = log && log.message ? log.message : '';
            const indexSplit = parsedMessage.split(' -- index: ');
            let index = '';
            if(indexSplit.length > 1){
                index = indexSplit[1];
            }
            if(hasStartedParsing && index === '0'){
                connector = connection.toConnector;
            }
            const data = ConnectionLogs.parseMessage(connector, message);
            if(index === '0'){
                hasStartedParsing = true;
            }
            dispatch(addCurrentLog(data));
        }
        const subscribeLogs = () => {
            if(testSchedule) {
                const socketInstance = Socket.createSocket(authUser.token, `&schedulerId=${testSchedule.schedulerId}`);
                socketInstance.subscribe.ConnectionLogs((data) => {
                    saveLogs(data);
                })
                setSocket(socketInstance);
            }
        }
        useEffect(() => {
            return () => {
                if (socket) {
                    socket.unsubscribe.ConnectionLogs();
                    socket.disconnect();
                }
            };
        },[])
        useEffect(() => {
            if(testSchedule) {
                if (socket) {
                    socket.unsubscribe.ConnectionLogs();
                    socket.disconnect();
                }
                subscribeLogs();
            }
        }, [testSchedule?.schedulerId]);
        useEffect(() => {
            if(shouldClear){
                dispatch(clearCurrentLogs());
            }
        }, [shouldClear])
        return null;
}

SyncLogs.defaultProps = {
    shouldClear: false,
}

export default SyncLogs;
