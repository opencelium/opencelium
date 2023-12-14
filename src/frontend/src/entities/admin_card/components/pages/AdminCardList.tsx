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

import React, {FC} from 'react';
import {permission} from "@entity/application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import AdminCards from "../../collections/AdminCards";
import { AdminCardPermissions } from '../../constants';
import {AdminCardListProps} from "./interfaces";
import { baseUrl } from '@entity/application/requests/classes/url';

const AdminCardList: FC<AdminCardListProps> = permission(AdminCardPermissions.READ)(({}) => {
    const adminCards = [
        {id: 1, name: 'Users', link: '/users'},
        {id: 2, name: 'Groups', link: '/usergroups'},
        {id: 3, name: 'External Applications', link: '/apps'},
        {id: 4, name: 'Invokers', link: '/invokers'},
        {id: 5, name: 'Templates', link: '/templates'},
        {id: 6, name: 'Data Aggregator', link: '/data_aggregator'},
        //{id: 6, name: 'Converter', link: '/template_converter'},
        {id: 7, name: 'Notification Templates', link: '/notification_templates'},
        {id: 8, name: 'Update Assistant', link: '/update_assistant'},
        {id: 9, name: 'Swagger API Docs', link: `${baseUrl}docs`, isExternalHref: true},
    ];
    const CAdminCards = new AdminCards(adminCards);
    return (
        <CollectionView collection={CAdminCards} componentPermission={AdminCardPermissions}/>
    )
})

AdminCardList.defaultProps = {
}

export {
    AdminCardList,
};
