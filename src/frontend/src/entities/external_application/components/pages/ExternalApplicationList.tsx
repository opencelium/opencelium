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

import React, {FC, useEffect} from 'react';
import {kibanaUrl} from "@entity/application/requests/classes/url";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import MariaDBImagePath from "@image/apps/mariadb.png";
import {ExternalApplicationListProps} from "../pages/interfaces";
import ExternalApplications from "../../collections/ExternalApplications";
import {checkAllExternalApplications} from "../../redux_toolkit/action_creators/ExternalApplicationCreators";
import {ExternalApplication} from "../../classes/ExternalApplication";
import {ExternalApplicationPermissions} from '../../constants';
import {ExternalApplicationStatus} from "@entity/external_application/requests/interfaces/IExternalApplication";

const ExternalApplicationList: FC<ExternalApplicationListProps> = permission(ExternalApplicationPermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {checkingAll, actuatorHealth} = ExternalApplication.getReduxState();
    let externalApplications: ExternalApplication[] = [];
    useEffect(() => {
        dispatch(checkAllExternalApplications())
    }, []);
    if((checkingAll === API_REQUEST_STATE.FINISH || checkingAll === API_REQUEST_STATE.ERROR) && actuatorHealth){
        externalApplications.push({
            id: 1, name: 'MariaDB', icon: MariaDBImagePath, link: '', value: 'db',
            status: actuatorHealth.components?.db?.status || ExternalApplicationStatus.DOWN,
            version: actuatorHealth.components?.db?.details.version || '',
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
