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

import React, {FC, Suspense, useEffect} from "react";
import {createGlobalStyle} from "styled-components";
import {useLocation, useNavigate} from "react-router";
import {Auth} from "@application/classes/Auth";
import NotificationItem from "@app_component/layout/top_bar/NotificationItem";
import {LayoutLoading} from "@app_component/base/loading/LayoutLoading";
import {LoginFormProps} from "./interfaces";
import LoginFormInputs from "@app_component/default_pages/login/LoginFormInputs";

const Global = createGlobalStyle`
    body{
        background: #fff !important;
    }
`;
const LoginForm: FC<LoginFormProps> = ({}) => {
    const {
        isAuth,
    } = Auth.getReduxState();
    let navigate = useNavigate();
    let location = useLocation();
    // @ts-ignore
    let from = location.state?.from?.pathname || "/";
    useEffect(() => {
        if(isAuth){
            setTimeout(() => {
                navigate(from, { replace: true });
            }, 500);
        }
    }, [isAuth]);
    return(
        <Suspense fallback={(<LayoutLoading/>)}>
            <Global/>
            {!isAuth && <NotificationItem/>}
            <LoginFormInputs isAuth={isAuth}/>
        </Suspense>
    )
}

export default LoginForm
