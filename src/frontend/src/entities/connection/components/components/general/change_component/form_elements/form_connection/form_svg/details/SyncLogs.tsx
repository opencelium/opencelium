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

const SyncLogs: FC<{shouldClear?: boolean}> =
    ({
        shouldClear,
    }) => {
        const dispatch = useAppDispatch();
        const {authUser} = Auth.getReduxState();
        const [socket, setSocket] = useState<Socket>(null);
        const [pauseTime, setPauseTime] = useState<number>(0);
        const saveLogs = (message: Message): void => {
            const data = ConnectionLogs.parseMessage(message);
            if(data.message === ConnectionLogs.BreakMessage){
                setPauseTime(oldTime => {
                    setTimeout(() => dispatch(addCurrentLog(data)), oldTime);
                    return oldTime + 500;
                })
            } else{
                setPauseTime(oldTime => {
                    setTimeout(() => dispatch(addCurrentLog(data)), oldTime);
                    return oldTime + 10;
                })
            }
        }
        const subscribeLogs = () => {
            const socketInstance = socket ? socket : Socket.createSocket(authUser.token);
            socketInstance.subscribe.ConnectionLogs((data) => {
                saveLogs(data);
            })
            setSocket(socketInstance);
        }
        useEffect(() => {
            subscribeLogs();
            return () => {
                if(socket){
                    socket.unsubscribe.ConnectionLogs();
                    socket.disconnect();
                }
            };
        }, [])
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