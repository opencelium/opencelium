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

import React, {FC, useEffect, useState} from 'react';
import {ConnectorListProps} from "./interfaces";
import Connectors from "@collection/Connectors";
import {Connector} from "@class/connector/Connector";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllConnectors} from "@action/ConnectorCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {ConnectorPermissions} from "@constants/permissions";
import {permission} from "../../../decorators/permission";

const ConnectorList: FC<ConnectorListProps> = permission(ConnectorPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingConnectors, connectors, deletingConnectorsById, uploadingConnectorImage} = Connector.getReduxState();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    useEffect(() => {
        dispatch(getAllConnectors());
    }, []);
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [connectors])
    const CConnectors = new Connectors(connectors, dispatch, deletingConnectorsById, uploadingConnectorImage);
    return (
        <CollectionView collection={CConnectors} shouldBeUpdated={shouldBeUpdated} isLoading={gettingConnectors === API_REQUEST_STATE.START} componentPermission={ConnectorPermissions}/>
    )
})

ConnectorList.defaultProps = {
}

export {
    ConnectorList,
};