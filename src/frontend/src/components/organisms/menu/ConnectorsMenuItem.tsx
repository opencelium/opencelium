import React, {FC} from 'react';
import MenuLink from "@molecule/menu/MenuLink";
import {ConnectorPermissions} from "@constants/permissions";

const ConnectorsMenuItem: FC =
    ({

    }) => {
    return (
        <MenuLink
            permission={ConnectorPermissions.READ}
            size={30}
            to={'/connectors'}
            name={'settings_input_hdmi'}
            label={'Connectors'}
        />
    )
}

ConnectorsMenuItem.defaultProps = {
}


export {
    ConnectorsMenuItem,
};
