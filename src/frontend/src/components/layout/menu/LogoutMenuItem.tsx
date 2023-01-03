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
import {useNavigate} from "react-router";
import {useDispatch} from "react-redux";
import { logout } from '@application/redux_toolkit/slices/AuthSlice';
import MenuLink from "./base/MenuLink";
import {MenuItemProps} from "@app_component/layout/menu/interfaces";

const LogoutMenuItem: FC<MenuItemProps> = ({isReadonly, onHoverColor}) => {
        const dispatch = useDispatch()
        let navigate = useNavigate();
        return (
            <MenuLink
                key={'log_out'}
                to={'#'}
                onClick={() => {
                    if(!isReadonly) {
                        dispatch(logout(null));
                        navigate("/login", {replace: true});
                    }
                }}
                name={'logout'}
                label={'Log Out'}
                size={30}
                hasConfirmation={!isReadonly}
                confirmationText={'Do you want to logout?'}
                isReadonly={isReadonly}
                onHoverColor={onHoverColor}
            />
        )
    }

LogoutMenuItem.defaultProps = {
}


export {
    LogoutMenuItem,
};
