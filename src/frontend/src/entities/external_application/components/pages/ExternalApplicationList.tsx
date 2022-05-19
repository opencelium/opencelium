/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect} from 'react';
import {kibanaUrl, neo4jUrl} from "@entity/application/requests/classes/url";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import KibanaImagePath from "@image/apps/kibana.png";
import Neo4jImagePath from "@image/apps/neo4j.png";
import {ExternalApplicationListProps} from "../pages/interfaces";
import ExternalApplications from "../../collections/ExternalApplications";
import {checkAllExternalApplications} from "../../redux_toolkit/action_creators/ExternalApplicationCreators";
import {ExternalApplication} from "../../classes/ExternalApplication";
import { ExternalApplicationPermissions } from '../../constants';

const ExternalApplicationList: FC<ExternalApplicationListProps> = permission(ExternalApplicationPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {checkingAll, actuatorHealth} = ExternalApplication.getReduxState();
    let externalApplications: ExternalApplication[] = [];
    useEffect(() => {
        dispatch(checkAllExternalApplications())
    }, []);
    if(checkingAll === API_REQUEST_STATE.FINISH){
        externalApplications.push({
            id: 1, name: 'Kibana', icon: KibanaImagePath, link: kibanaUrl, value: 'elasticsearch',
            status: actuatorHealth.details.elasticsearch.status
        })
        externalApplications.push({
            id: 2, name: 'Neo4j', icon: Neo4jImagePath, link: neo4jUrl, value: 'neo4j',
            status: actuatorHealth.details.neo4j.status,
        })
    }
    const CExternalApplications = new ExternalApplications(externalApplications);
    return (
        <CollectionView collection={CExternalApplications} isLoading={checkingAll === API_REQUEST_STATE.START} componentPermission={ExternalApplicationPermissions}/>
    )
})

ExternalApplicationList.defaultProps = {
}

export {
    ExternalApplicationList,
};