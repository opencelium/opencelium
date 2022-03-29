import React, {FC, useState} from 'react';
import {LoginIconStyled} from './styles';
import LogoOcWhiteImagePath from "@images/logo_oc_white.png";
import {LoginIconProps} from "@molecule/login_icon/interfaces";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import Icon from "@atom/icon/Icon";
import {Auth} from "@class/application/Auth";
import {IAuth} from "@interface/application/IAuth";
import {Image} from "@atom/image/Image";

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
