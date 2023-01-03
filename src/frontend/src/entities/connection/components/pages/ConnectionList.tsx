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

import React, {FC, useEffect, useState} from 'react';
import {ConnectionListProps} from "./interfaces";
import Connections from "@entity/connection/collections/Connections";
import {Connection} from "@entity/connection/classes/Connection";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import {useAppDispatch} from "@application/utils/store";
import {getAllMetaConnections} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import {checkNeo4j} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";
import {ExternalApplication} from "@entity/external_application/classes/ExternalApplication";
import {ExternalApplicationStatus} from "@entity/external_application/requests/interfaces/IExternalApplication";
import {INotification, NotificationType} from "@application/interfaces/INotification";
import { addNotification } from '@application/redux_toolkit/slices/ApplicationSlice';
import { ConnectionPermissions } from '@entity/connection/constants';

const ConnectionList: FC<ConnectionListProps> = permission(ConnectionPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingMetaConnections, metaConnections, deletingConnectionsById, updatingConnection} = Connection.getReduxState();
    const {neo4jCheckResults} = ExternalApplication.getReduxState();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    useEffect(() => {
        dispatch(getAllMetaConnections());
        dispatch(checkNeo4j())
    }, [])
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [metaConnections])
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
    const CConnections = new Connections(metaConnections, dispatch, deletingConnectionsById, updatingConnection);
    return (
        <CollectionView collection={CConnections} shouldBeUpdated={shouldBeUpdated} isLoading={gettingMetaConnections === API_REQUEST_STATE.START} componentPermission={ConnectionPermissions}/>
    )
})

ConnectionList.defaultProps = {
}

export {
    ConnectionList,
};