import React, {FC} from 'react';
import MenuLink from "@molecule/menu/MenuLink";
import {ConnectionPermissions} from "@constants/permissions";

const ConnectionsMenuItem: FC =
    ({

     }) => {
        return (
            <MenuLink
                permission={ConnectionPermissions.READ}
                size={30}
                to={'/connections'}
                name={'sync_alt'}
                label={'Connections'}
            />
        )
    }

ConnectionsMenuItem.defaultProps = {
}


export {
    ConnectionsMenuItem,
};
