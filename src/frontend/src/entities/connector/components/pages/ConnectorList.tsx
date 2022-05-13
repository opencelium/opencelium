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
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import Connectors from "../../collections/Connectors";
import {Connector} from "../../classes/Connector";
import {getAllConnectors} from "../../redux_toolkit/action_creators/ConnectorCreators";
import { ConnectorPermissions } from '../../constants';
import {ConnectorListProps} from "./interfaces";

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