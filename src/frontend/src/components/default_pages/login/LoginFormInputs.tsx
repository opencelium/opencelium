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
import {Auth} from "@application/classes/Auth";
import {IAuth} from "@application/interfaces/IAuth";
import {onEnter} from "@application/utils/utils";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import {ColorTheme} from "@style/Theme";
import {HeaderStyled, LoginFormStyled} from "./styles";
import {LoginIcon} from "./login_icon/LoginIcon";

const LoginFormInputs = ({isAuth, hasAnimation}: {isAuth: boolean, hasAnimation?: boolean}) => {
    const LoginForm = Auth.createState<IAuth>();
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
        <LoginFormStyled isAuth={isAuth}>
            <HeaderStyled isAuth={isAuth}>Log In</HeaderStyled>
            {EmailInput}
            {PasswordInput}
            <LoginIcon hasAnimation={hasAnimation} login={() => LoginForm.login()}/>
        </LoginFormStyled>
    )
}

LoginFormInputs.defaultProps = {
    hasAnimation: true,
}

export default LoginFormInputs;
