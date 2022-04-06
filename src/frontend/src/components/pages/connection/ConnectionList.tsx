/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect} from 'react';
import {ConnectionListProps} from "./interfaces";
import Connections from "@collection/Connections";
import {Connection} from "@class/connection/Connection";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllMetaConnections} from "@action/connection/ConnectionCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {ConnectionPermissions, ConnectorPermissions} from "@constants/permissions";
import {permission} from "../../../decorators/permission";
import {checkNeo4j} from "@action/external_application/ExternalApplicationCreators";
import {ExternalApplication} from "@class/external_application/ExternalApplication";
import {ExternalApplicationStatus} from "@requestInterface/external_application/IExternalApplication";
import {INotification, NotificationType} from "@interface/application/INotification";
import { addNotification } from '@store/reducers/application/ApplicationSlice';

const ConnectionList: FC<ConnectionListProps> = permission(ConnectorPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingMetaConnections, metaConnections, deletingConnectionsById} = Connection.getReduxState();
    const {neo4jCheckResults} = ExternalApplication.getReduxState();
    useEffect(() => {
        dispatch(getAllMetaConnections());
        dispatch(checkNeo4j())
    }, [])
    useEffect(() => {
        if(neo4jCheckResults?.status === ExternalApplicationStatus.DOWN){
            let date = new Date();
            const notification: INotification = {
                id: date.getTime(),
                type: NotificationType.ERROR,
                actionType: checkNeo4j.rejected.type,
                createdTime: date.getTime().toString(),
                params: {message: ExternalApplicationStatus.DOWN}
            }
            dispatch(addNotification(notification))
        }
    },[neo4jCheckResults])
    const CConnections = new Connections(metaConnections, dispatch, deletingConnectionsById);
    return (
        <CollectionView collection={CConnections} isLoading={gettingMetaConnections === API_REQUEST_STATE.START} componentPermission={ConnectionPermissions}/>
    )
})

ConnectionList.defaultProps = {
}

export {
    ConnectionList,
};