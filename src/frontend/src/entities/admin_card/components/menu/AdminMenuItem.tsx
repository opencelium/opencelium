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

import React, {FC} from 'react';
import {MenuLinkWithSubLinks} from "@app_component/layout/menu/base/MenuLinkWithSublinks";
import {AdminMenuItemProps} from "@app_component/layout/menu/interfaces";
import { UserPermissions } from '@entity/user/constants';
import { UserGroupPermissions } from '@entity/user_group/constants';
import { ExternalApplicationPermissions } from '@entity/external_application/constants';
import { InvokerPermissions } from '@entity/invoker/constants';
import {TemplatePermissions} from "@entity/template/constants";

const AdminMenuItem_3: FC<AdminMenuItemProps> =
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

AdminMenuItem_3.defaultProps = {
}


export {
    AdminMenuItem_3,
};