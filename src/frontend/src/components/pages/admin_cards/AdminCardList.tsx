import React, {FC} from 'react';
import {CollectionView} from "@organism/collection_view/CollectionView";
import {AdminCardListProps} from "@page/admin_cards/interfaces";
import AdminCards from "@collection/AdminCards";
import {permission} from "../../../decorators/permission";
import {AdminCardPermissions} from "@constants/permissions";

const AdminCardList: FC<AdminCardListProps> = permission(AdminCardPermissions.READ)(({}) => {
    const adminCards = [
        {id: 1, name: 'Users', link: '/users'},
        {id: 2, name: 'Groups', link: '/usergroups'},
        {id: 3, name: 'External Applications', link: '/apps'},
        {id: 4, name: 'Invokers', link: '/invokers'},
        {id: 5, name: 'Templates', link: '/templates'},
        {id: 6, name: 'Converter', link: '/template_converter'},
        {id: 7, name: 'Notification Templates', link: '/notification_templates'},
        {id: 8, name: 'Update Assistant', link: '/update_assistant'},
        {id: 9, name: 'Subscription Update', link: '/update_subscription'},
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