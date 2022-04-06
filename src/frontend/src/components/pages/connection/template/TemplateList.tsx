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
import {TemplateListProps} from "../interfaces";
import Templates from "@collection/Templates";
import {Template} from "@class/connection/Template";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../../hooks/redux";
import {getAllTemplates} from "@action/connection/TemplateCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {TemplatePermissions} from "@constants/permissions";
import {permission} from "../../../../decorators/permission";
import {getAllConnectors} from "@action/ConnectorCreators";
import {Connector} from "@class/connector/Connector";

const TemplateList: FC<TemplateListProps> = permission(TemplatePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingTemplates, templates, deletingTemplatesById} = Template.getReduxState();
    const {gettingConnectors, connectors} = Connector.getReduxState();
    useEffect(() => {
        dispatch(getAllTemplates());
        dispatch(getAllConnectors());
    }, [])
    const filteredTemplates = templates.filter((template) => {
        // @ts-ignore
        return connectors.findIndex(connector => connector.connectorId === template.connection.fromConnector.connectorId && connector.invoker.name === template.connection.fromConnector.invoker.name) !== -1 &&
        // @ts-ignore
            connectors.findIndex(connector => connector.connectorId === template.connection.toConnector.connectorId && connector.invoker.name === template.connection.toConnector.invoker.name) !== -1
    });
    const CTemplates = new Templates(filteredTemplates, dispatch, deletingTemplatesById);
    return (
        <CollectionView collection={CTemplates} isLoading={gettingTemplates === API_REQUEST_STATE.START || gettingConnectors === API_REQUEST_STATE.START} componentPermission={TemplatePermissions}/>
    )
})

TemplateList.defaultProps = {
}

export {
    TemplateList,
};