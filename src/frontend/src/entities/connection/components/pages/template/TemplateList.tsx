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
import {TemplateListProps} from "../interfaces";
import Templates from "@entity/template/collections/Templates";
import {Template} from "@entity/connection/classes/Template";
import {useAppDispatch} from "@application/utils/store";
import {getAllTemplates} from "@entity/template/redux_toolkit/action_creators/TemplateCreators";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@application/utils/permission";
import {getAllConnectors} from "@entity/connector/redux_toolkit/action_creators/ConnectorCreators";
import {Connector} from "@entity/connector/classes/Connector";
import { TemplatePermissions } from '@entity/template/constants';
import CollectionView from "@app_component/collection/collection_view/CollectionView";

const TemplateList: FC<TemplateListProps> = permission(TemplatePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    const {gettingTemplates, templates, deletingTemplatesById} = Template.getReduxState();
    const {gettingConnectors, connectors} = Connector.getReduxState();
    useEffect(() => {
        dispatch(getAllTemplates());
        dispatch(getAllConnectors());
    }, [])
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [templates])
    const CTemplates = new Templates(templates, dispatch, deletingTemplatesById);
    return (
        <CollectionView collection={CTemplates} shouldBeUpdated={shouldBeUpdated} isLoading={gettingTemplates === API_REQUEST_STATE.START || gettingConnectors === API_REQUEST_STATE.START} componentPermission={TemplatePermissions}/>
    )
})

TemplateList.defaultProps = {
}

export {
    TemplateList,
};