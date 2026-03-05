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

import React from "react";
import {useNavigate} from "react-router";
import {Toast, ToastBody, ToastHeader} from "reactstrap";

import {Auth} from "@application/classes/Auth";
import {IAuth} from "@application/interfaces/IAuth";
import {onEnter} from "@application/utils/utils";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import {ColorTheme} from "@style/Theme";
import {ForgotPasswordLink, HeaderStyled, LoginFormStyled} from "./styles";
import {LoginIcon} from "./login_icon/LoginIcon";
import AuthCode from "@app_component/default_pages/login/AuthCode";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const WRONG_LOGIN_MESSAGE = "Username or password is wrong.";

const LoginFormInputs = ({isAuth, hasAnimation}: {isAuth: boolean, hasAnimation?: boolean}) => {
    const navigate = useNavigate();

    const authRedux = Auth.getReduxState();
    const {sessionId, logining, error} = authRedux;

    const LoginForm = Auth.createState<IAuth>();

  const onForgotPasswordClick = React.useCallback(() => {
    navigate("/forgot-password");
  }, [navigate]);

    const passwordError = React.useMemo(() => {
        if (logining !== API_REQUEST_STATE.ERROR) return "";

        const msg = String((error as any)?.message || "");
        if (msg === "SESSION_ID_IS_REQUIRED") return "";

        return msg ? WRONG_LOGIN_MESSAGE : "";
    }, [logining, error]);

    const UsernameInput = LoginForm.getText({
        propertyName: "username",
        props: {
            required: true,
            background: ColorTheme.White,
            minHeight: isAuth ? 0 : 73,
            height: isAuth ? 0 : 'unset',
            paddingTop: isAuth ? '0' : '20px',
            paddingLeft: '5px',
            paddingRight: '5px',
            placeholder: 'Email',
            paddingLeftInput: '5px',
            paddingRightInput: '5px',
            errorBottom: '3px',
            overflow: isAuth ? 'hidden' : 'unset',
            onKeyPress: (e) => onEnter(e, () => LoginForm.login()),
            rightIcon: 'info',
            onRightIconClick: () => {
                window.open('https://docs.opencelium.io/en/prod/usage/login.html', '_blank');
            },
        }
    });

    const PasswordInput = LoginForm.getText({
        propertyName: "password",
        props: {
            type: InputTextType.Password,
            required: true,
            background: ColorTheme.White,
            minHeight: isAuth ? 0 : 73,
            height: isAuth ? 0 : 'unset',

            helpMessage: [
                {
                    content: (
                        <div>
                            This is the invoker file that contains the API description of the system.
                            <br />
                            Select the invoker and set the credentials.
                        </div>
                    ),
                    disableBeacon: true,
                    disableOverlayClose: true,
                    hideCloseButton: true,
                    hideFooter: true,
                    placement: 'bottom',
                    spotlightClicks: true,
                    styles: {
                        options: {
                            zIndex: 10000,
                        },
                    },
                    target: '',
                    title: 'Invoker',
                }
            ],
            paddingTop: isAuth ? '0' : '20px',
            paddingLeft: '5px',
            paddingRight: '5px',
            placeholder: 'Password',
            paddingLeftInput: '5px',
            errorBottom: '3px',
            overflow: isAuth ? 'hidden' : 'unset',
            onKeyPress: (e) => onEnter(e, () => LoginForm.login()),
            error: passwordError,
        }
    });

    return(
        <>
            <LoginFormStyled isAuth={isAuth}>
                <HeaderStyled isAuth={isAuth}>Log In</HeaderStyled>

                {UsernameInput}
                {PasswordInput}

                <LoginIcon hasAnimation={hasAnimation} login={() => LoginForm.login()}/>
                {!!sessionId && <AuthCode/>}
            </LoginFormStyled>

            {!isAuth && (
                <ForgotPasswordLink onClick={onForgotPasswordClick}>
                Forgot password?
                </ForgotPasswordLink>
            )}
        </>
    )
}

LoginFormInputs.defaultProps = {
    hasAnimation: true,
}

export default LoginFormInputs;