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
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import CollectionView from "@app_component/collection/collection_view/CollectionView";
import {NotificationTemplateListProps} from "./interfaces";
import NotificationTemplates from "../../collections/NotificationTemplates";
import {NotificationTemplate} from "../../classes/NotificationTemplate";
import {getAllNotificationTemplates} from "../../redux_toolkit/action_creators/NotificationTemplateCreators";
import { NotificationTemplatePermissions } from '../../constants';

const NotificationTemplateList: FC<NotificationTemplateListProps> = permission(NotificationTemplatePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const {gettingNotificationTemplates, notificationTemplates, deletingNotificationTemplatesById} = NotificationTemplate.getReduxState();
    useEffect(() => {
        (async () => {
            try {
                await dispatch(getAllNotificationTemplates());
            } catch(e) {

            } finally {
                setIsLoading(false);
            }
        })()
    }, [])
    const CNotificationTemplates = new NotificationTemplates(notificationTemplates, dispatch, deletingNotificationTemplatesById);
    return (
        <CollectionView
            entityKey={'notification-template-list'}
            collection={CNotificationTemplates}
            isLoading={isLoading}
            componentPermission={NotificationTemplatePermissions}
        />
    )
})

NotificationTemplateList.defaultProps = {
}

export {
    NotificationTemplateList,
};
