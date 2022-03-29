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