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

import React, {FC, useState} from 'react';
import LogoOcWhiteImagePath from "@image/application/logo_oc_white.png";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {Auth} from "@application/classes/Auth";
import {Image} from "@app_component/base/image/Image";
import {LoginIconProps} from "./interfaces";
import {LoginIconStyled} from './styles';

const LoginIcon: FC<LoginIconProps> =
    ({
        login,
     }) => {
        const {
            isAuth,
            logining,
        } = Auth.getReduxState();
        const [hasRotation, toggleRotation] = useState(false);
        const onClick = () => {
            toggleRotation(true);
            setTimeout(() => {
                toggleRotation(false);
                login();
            }, 800);
        }
        return (
            <LoginIconStyled hasRotation={hasRotation} isAuth={false}>
                <Image src={LogoOcWhiteImagePath} alt={'OpenCelium'} onClick={onClick} isLoading={logining === API_REQUEST_STATE.START} width={isAuth ? '40px' : '48px'} loadingSize={'30px'}/>
            </LoginIconStyled>
        )
    }

LoginIcon.defaultProps = {
}


export {
    LoginIcon,
};
