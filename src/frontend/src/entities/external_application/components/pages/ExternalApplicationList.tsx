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
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import MariaDBImagePath from "@image/apps/mariadb.png";
import MongoDBImagePath from "@image/apps/mongodb.png";
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
            id: 1, name: actuatorHealth.components?.mariaDB?.details.name || 'MariaDB', icon: MariaDBImagePath, link: '', value: actuatorHealth.components?.mariaDB?.details.name || 'db',
            status: actuatorHealth.components?.mariaDB?.status || ExternalApplicationStatus.DOWN,
            version: `v. ${actuatorHealth.components?.mariaDB?.details.version}` || '',
            error: actuatorHealth.components?.mariaDB?.details?.error || '-',
        },{
            id: 2, name: actuatorHealth.components?.mongoDB?.details.name || 'MongoDB', icon: MongoDBImagePath, link: '', value: actuatorHealth.components?.mongoDB?.details.name || 'db',
            status: actuatorHealth.components?.mongoDB?.status || ExternalApplicationStatus.DOWN,
            version: `v. ${actuatorHealth.components?.mongoDB?.details.version}` || '',
            error: actuatorHealth.components?.mongoDB?.details?.error || '-',
        })
        if (actuatorHealth.components?.email) {
            externalApplications.push({
                id: 3, name: 'Email', icon: MongoDBImagePath, link: '', value: 'email',
                status: actuatorHealth.components?.email?.status || ExternalApplicationStatus.DOWN,
                version: actuatorHealth.components?.email?.details.location || '',
                error: actuatorHealth.components?.email?.details?.error || '-',
            })
        }
        if (actuatorHealth.components?.polyglot) {
            externalApplications.push({
                id: 4, name: actuatorHealth.components?.polyglot?.details.name || 'Polyglot', icon: MongoDBImagePath, link: '', value: 'polyglot',
                status: actuatorHealth.components?.polyglot?.status || ExternalApplicationStatus.DOWN,
                version: '',
                error: actuatorHealth.components?.polyglot?.details?.error || '-',
            })
        }
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
