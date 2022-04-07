/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, Suspense, useEffect} from "react";
import {Auth} from "@class/application/Auth";
import {IAuth} from "@interface/application/IAuth";
import {LoginIcon} from "@molecule/login_icon/LoginIcon";
import {HeaderStyled, LoginFormStyled} from "@page/login/styles";
import {ColorTheme} from "../../general/Theme";
import {onEnter} from "../../utils";
import {InputTextType} from "@atom/input/text/interfaces";
import {useLocation, useNavigate} from "react-router";
import NotificationItem from "@organism/top_bar/NotificationItem";
import {LoginFormProps} from "@page/login/interfaces";
import {createGlobalStyle} from "styled-components";
import LayoutLoading from "@molecule/loading/LayoutLoading";

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