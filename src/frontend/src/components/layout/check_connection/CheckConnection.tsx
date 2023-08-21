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

import React, {FC, Suspense, useEffect, useState} from 'react';
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {LogoutProps} from "@application/interfaces/IAuth";
import {logout} from "@application/redux_toolkit/slices/AuthSlice";
import Dialog from "@app_component/base/dialog/Dialog";
import LoginFormInputs from "@app_component/default_pages/login/LoginFormInputs";
import {ResponseMessages} from "@application/requests/interfaces/IResponse";
import { Auth } from '@application/classes/Auth';
import CheckConnection from "@application/classes/CheckConnection";
import {checkConnection} from "@application/redux_toolkit/action_creators/CheckConnectionCreators";

const CheckConnectionComponent: FC =
    ({
         children,
     }) => {
        const dispatch = useAppDispatch();
        const {isAuth} = Auth.getReduxState();
        const {checkingConnection} = CheckConnection.getReduxState();
        const [timerId, setTimerId] = useState(null);
        const exit = () => {
            clear();
            const logoutProps: LogoutProps = {wasAccessDenied: true, message: ResponseMessages.UNSUPPORTED_HEADER_AUTH_TYPE};
            dispatch(logout(logoutProps));
        }
        const clear = () => {
            if (timerId) {
                clearInterval(timerId);
                setTimerId(null);
            }
        }
        useEffect(() => {
            return () => {
                clear();
            }
        }, [timerId])
        useEffect(() => {
            if(!isAuth){
                clear();
            }
        }, [isAuth])
        useEffect(() => {
            if(checkingConnection === API_REQUEST_STATE.ERROR && timerId){
                clear();
            }
            if(checkingConnection !== API_REQUEST_STATE.ERROR && !timerId){
                const id = setInterval(() => {
                    dispatch(checkConnection());
                }, 5000);
                setTimerId(id);
            }
        }, [checkingConnection])
        return (
            <Dialog
                actions={[]}
                active={checkingConnection === API_REQUEST_STATE.ERROR}
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
