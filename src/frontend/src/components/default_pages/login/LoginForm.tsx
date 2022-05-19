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

import React, {FC, Suspense, useEffect} from "react";
import {createGlobalStyle} from "styled-components";
import {useLocation, useNavigate} from "react-router";
import {Auth} from "@application/classes/Auth";
import {IAuth} from "@application/interfaces/IAuth";
import {onEnter} from "@application/utils/utils";
import {HeaderStyled, LoginFormStyled} from "./styles";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import NotificationItem from "@app_component/layout/top_bar/NotificationItem";
import {LayoutLoading} from "@app_component/base/loading/LayoutLoading";
import {ColorTheme} from "@style/Theme";
import {LoginFormProps} from "./interfaces";
import {LoginIcon} from "./login_icon/LoginIcon";

const Global = createGlobalStyle`
    body{
        background: #fff !important;
    }
`;
const LoginForm: FC<LoginFormProps> = ({}) => {
    const LoginForm = Auth.createState<IAuth>();
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
    const EmailInput = LoginForm.getText({
        propertyName: "email", props: {/*
            icon: 'email', label: 'E-Mail',*/
            required: true,
            background: ColorTheme.White,
            minHeight: isAuth ? 0 : 73,
            height: isAuth ? 0 : 'unset',
            paddingTop: isAuth ? '0' : '20px',
            paddingLeft: '5px',
            paddingRight: '5px',
            placeholder: 'E-Mail',
            paddingLeftInput: '5px',
            paddingRightInput: '5px',
            overflow: isAuth ? 'hidden' : 'unset',
            onKeyPress: (e) => onEnter(e, () => LoginForm.login()),
        }
    })
    const PasswordInput = LoginForm.getText({
        propertyName: "password", props: {/*
            icon: 'password', label: 'Password',*/
            type: InputTextType.Password,
            required: true,
            background: ColorTheme.White,
            minHeight: isAuth ? 0 : 73,
            height: isAuth ? 0 : 'unset',
            paddingTop: isAuth ? '0' : '20px',
            paddingLeft: '5px',
            paddingRight: '5px',
            placeholder: 'Password',
            paddingLeftInput: '5px',
            overflow: isAuth ? 'hidden' : 'unset',
            onKeyPress: (e) => onEnter(e, () => LoginForm.login()),
        }
    })
    return(
        <Suspense fallback={(<LayoutLoading/>)}>
            <Global/>
            {!isAuth && <NotificationItem/>}
            <LoginFormStyled isAuth={isAuth}>
                <HeaderStyled isAuth={isAuth}>Log In</HeaderStyled>
                {EmailInput}
                {PasswordInput}
                <LoginIcon login={() => LoginForm.login()}/>
            </LoginFormStyled>
        </Suspense>
    )
}

export default LoginForm