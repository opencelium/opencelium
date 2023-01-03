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
import MenuLink from "@app_component/layout/menu/base/MenuLink";
import {ConnectorPermissions} from "../../constants";
import {MenuItemProps} from "@app_component/layout/menu/interfaces";

const ConnectorsMenuItem_0: FC<MenuItemProps> = ({isReadonly, onHoverColor}) => {
    return (
        <MenuLink
            permission={ConnectorPermissions.READ}
            size={30}
            to={'/connectors'}
            name={'settings_input_hdmi'}
            label={'Connectors'}
            isReadonly={isReadonly}
            onHoverColor={onHoverColor}
        />
    )
}

ConnectorsMenuItem_0.defaultProps = {
}


export {
    ConnectorsMenuItem_0,
};
