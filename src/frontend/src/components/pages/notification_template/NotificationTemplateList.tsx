import React, {FC, useEffect} from 'react';
import {NotificationTemplateListProps} from "./interfaces";
import NotificationTemplates from "@collection/NotificationTemplates";
import {NotificationTemplate} from "@class/schedule/NotificationTemplate";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllNotificationTemplates} from "@action/schedule/NotificationTemplateCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {NotificationTemplatePermissions} from "@constants/permissions";
import {permission} from "../../../decorators/permission";

const NotificationTemplateList: FC<NotificationTemplateListProps> = permission(NotificationTemplatePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {gettingNotificationTemplates, notificationTemplates, deletingNotificationTemplatesById} = NotificationTemplate.getReduxState();
    useEffect(() => {
        dispatch(getAllNotificationTemplates());
    }, [])
    const CNotificationTemplates = new NotificationTemplates(notificationTemplates, dispatch, deletingNotificationTemplatesById);
    return (
        <CollectionView collection={CNotificationTemplates} isLoading={gettingNotificationTemplates === API_REQUEST_STATE.START} componentPermission={NotificationTemplatePermissions}/>
    )
})

NotificationTemplateList.defaultProps = {
}

export {
    NotificationTemplateList,
};