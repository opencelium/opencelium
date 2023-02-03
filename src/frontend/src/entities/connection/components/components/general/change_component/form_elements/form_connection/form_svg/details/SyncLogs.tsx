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
import Socket from "@application/classes/Socket";
import {addCurrentLog, clearCurrentLogs} from "@root/redux_toolkit/slices/ConnectionSlice";
import { Auth } from "@application/classes/Auth";
import {useAppDispatch} from "@application/utils/store";

const SyncLogs: FC<{shouldClear: boolean}> =
    ({
        shouldClear,
     }) => {
        const dispatch = useAppDispatch();
        const {authUser} = Auth.getReduxState();
        const [socket, setSocket] = useState(null);
        useEffect(() => {
            const socketInstance = Socket.createSocket(authUser.token);
            socketInstance.subscribe('/execution/logs', (data) => {
                const log = JSON.parse(data.body.toString());
                const message = log && log.message ? log.message : '';
                const indexSplit = message.split(' -- index: ');
                let index = '';
                if(indexSplit.length > 1){
                    index = indexSplit[1];
                }
                dispatch(addCurrentLog({connectorType: 'fromConnector', index, message}))
            })
            setSocket(socketInstance);
            return () => {
                socket.disconnect();
            };
        }, [])
        useEffect(() => {
            if(shouldClear){
                dispatch(clearCurrentLogs());
            }
        }, [shouldClear])
        return null;
    }

export default SyncLogs;