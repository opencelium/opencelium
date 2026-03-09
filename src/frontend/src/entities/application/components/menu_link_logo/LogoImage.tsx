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

import React, {useEffect, useRef, useState} from "react";
import {Auth} from "@application/classes/Auth";
import {checkImage, convertPngUrlToBase64} from "@application/utils/utils";
import {API_REQUEST_STATE, OC_NAME} from "@application/interfaces/IApplication";
import {RootState, useAppSelector} from "@application/utils/store";
import {Application} from "@application/classes/Application";
import LogoOcWhiteImagePath from "@image/application/logo_oc_white.png";
import {onlineApiServerOpenCeliumUrl} from "@entity/application/requests/classes/url";
import {LogoImageStyled, LoadingStyled} from "./styles";
import {TextSize} from "@app_component/base/text/interfaces";

const LogoImage = (props: any) => {
    const imageRef = useRef(null);
    const {authUser} = Auth.getReduxState();
    const {logoDataStatus, onlineServiceStatus} = Application.getReduxState();
    const {updatingUserDetail} = useAppSelector((state: RootState) => state.userDetailReducer);
    const [isLogoExist, setIsLogoExist] = useState<boolean>(null);
    const [src, setSrc] = useState<string>('');
    const logoName = authUser.logoName || OC_NAME;
    let logoPath = !!onlineServiceStatus?.active ? `${onlineApiServerOpenCeliumUrl}fsdlfshdfksldfdfsd-sdfjslkdfhsdlkfhfs-sdfjskdfhjsbdasdalksdhah/logo/${authUser.email}?${new Date().getTime()}` : LogoOcWhiteImagePath;
    useEffect(() => {
        if(!!onlineServiceStatus?.active) {
            checkImage(logoPath, () => {
                setIsLogoExist(true);
                setSrc(logoPath);
            }, () => {
                setIsLogoExist(false);
                setSrc(LogoOcWhiteImagePath);
            });
        }
    }, [onlineServiceStatus?.active])
    useEffect(() => {
        if(isLogoExist && !!onlineServiceStatus?.active){
            const check = convertPngUrlToBase64(logoPath).then((data) => {
                if(data) setSrc(data);
            });
        }
        setSrc('');
    }, [isLogoExist])
    useEffect(() => {
        if (updatingUserDetail === API_REQUEST_STATE.START) {
            setIsLogoExist(null);
        }
        if (updatingUserDetail === API_REQUEST_STATE.FINISH) {
            checkImage(logoPath, () => setIsLogoExist(true), () => setIsLogoExist(false));
        }
        if (updatingUserDetail === API_REQUEST_STATE.ERROR) {
            setIsLogoExist(false);
        }
    }, [updatingUserDetail, onlineServiceStatus?.active])
    useEffect(() => {
        setIsLogoExist(null);
        checkImage(logoPath, () => setIsLogoExist(true), () => setIsLogoExist(false));
    }, [logoDataStatus])
    if(isLogoExist === null){
        return <LoadingStyled className={props?.className || ''} size={TextSize.Size_18}/>;
    }
    return(
        <LogoImageStyled
            ref={imageRef}
            src={!!onlineServiceStatus?.active ? src || LogoOcWhiteImagePath : LogoOcWhiteImagePath}
            alt={logoName}
            {...props}
        />
    )
}

export default LogoImage;
