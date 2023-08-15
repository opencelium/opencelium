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
import {Outlet, useLocation} from "react-router";
import {LayoutLoading} from "@app_component/base/loading/LayoutLoading";
import ContentLoading from "@app_component/base/loading/ContentLoading";
import Menu from "./menu/Menu";
import NotificationPanel from "./notification_panel/NotificationPanel";
import TopBar from "./top_bar/TopBar";
import {useAppDispatch} from "@application/utils/store";
import {checkConnection} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import { Application } from '@application/classes/Application';
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {LogoutProps} from "@application/interfaces/IAuth";
import {logout} from "@application/redux_toolkit/slices/AuthSlice";
import Dialog from "@app_component/base/dialog/Dialog";
import LoginFormInputs from "@app_component/default_pages/login/LoginFormInputs";
import {ResponseMessages} from "@application/requests/interfaces/IResponse";

const OnlyOutletPages = ["/connection_overview_details", "/connection_overview_technical_layout", "/connection_overview_business_layout"]

const Layout: FC =
    ({
        children,
    }) => {
    const dispatch = useAppDispatch();
    const {pathname} = useLocation();
    const {checkingConnection} = Application.getReduxState();
    const isOnlyOutletPage = OnlyOutletPages.indexOf(pathname) !== -1;
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
    }, [])
    useEffect(() => {
        if(checkingConnection === API_REQUEST_STATE.ERROR && timerId){
            clear();
        }
        if(checkingConnection !== API_REQUEST_STATE.ERROR && !timerId){
            setTimerId(setInterval(() => {
                dispatch(checkConnection());
            }, 5000));
        }
    }, [checkingConnection])
    return (
        <React.Fragment>
            <Suspense fallback={(<LayoutLoading/>)}>
                {
                    !isOnlyOutletPage &&
                        <React.Fragment>
                            <TopBar/>
                            <Menu/>
                            <NotificationPanel/>
                        </React.Fragment>
                }
                <Suspense fallback={(<ContentLoading/>)}>
                    <Outlet/>
                </Suspense>
            </Suspense>
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
        </React.Fragment>
    )
}

Layout.defaultProps = {
}


export {
    Layout,
};
