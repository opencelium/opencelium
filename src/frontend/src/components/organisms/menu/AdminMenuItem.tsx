import React, {FC} from 'react';
import {MenuLinkWithSubLinks} from "@molecule/menu/MenuLinkWithSublinks";
import {AdminMenuItemProps} from "./interfaces";
import {
    ExternalApplicationPermissions,
    InvokerPermissions, TemplatePermissions,
    UserGroupPermissions,
    UserPermissions
} from "@constants/permissions";

const AdminMenuItem: FC<AdminMenuItemProps> =
    ({
         isMainMenuExpanded
    }) => {
        return (
            <MenuLinkWithSubLinks
                to={'/admin_cards'}
                name={'settings'}
                label={'Admin'}
                subLinks={[
                    {to: '/users', children: 'Users', permission: UserPermissions.READ},
                    {to: '/usergroups', children: 'Groups', permission: UserGroupPermissions.READ},
                    {to: '/apps', children: 'Apps', permission: ExternalApplicationPermissions.READ},
                    {to: '/invokers', children: 'Invokers', permission: InvokerPermissions.READ},
                    {to: '/templates', children: 'Templates', permission: TemplatePermissions.READ},
                ]}
                isMainMenuExpanded={isMainMenuExpanded}
            />
        )
    }

AdminMenuItem.defaultProps = {
}


export {
    AdminMenuItem,
};
