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

import React, {FC, useEffect} from 'react';
import {LogoutProps} from "@application/interfaces/IAuth";
import {logout, setIsAboutToLogout} from "@application/redux_toolkit/slices/AuthSlice";
import Dialog from "@app_component/base/dialog/Dialog";
import LoginFormInputs from "@app_component/default_pages/login/LoginFormInputs";
import {ResponseMessages} from "@application/requests/interfaces/IResponse";
import {useAppDispatch} from "@application/utils/store";
import {useSocketData} from "../../../socket/SocketDataContext";
import {Auth} from "@application/classes/Auth";
import {TRIPLET_STATE} from "@application/interfaces/IApplication";

const CheckConnectionComponent: FC =
    ({
         children,
    }) => {
        const {isAboutToLogout, authUser} = Auth.getReduxState();
        const dispatch = useAppDispatch();
        const exit = () => {
            const logoutProps: LogoutProps = {wasAccessDenied: true, message: ResponseMessages.UNSUPPORTED_HEADER_AUTH_TYPE};
            dispatch(logout(logoutProps));
        }
        useEffect(() => {
            if (authUser?.token) {
                if (isAboutToLogout) {
                    dispatch(setIsAboutToLogout(TRIPLET_STATE.FALSE));
                }
            }
        }, [authUser?.token]);
        return (
            <Dialog
                actions={[]}
                active={isAboutToLogout === TRIPLET_STATE.TRUE}
                toggle={exit}
                title={''}
                hasNoBody={true}
                hasNoActions={true}
                dialogTheme={{content: 'hide_dialog_content'}}
            >
                <LoginFormInputs isAuth={false} hasAnimation={false}/>
            </Dialog>
        )
    }

CheckConnectionComponent.defaultProps = {
}


export {
    CheckConnectionComponent,
};
