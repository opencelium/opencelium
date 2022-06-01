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

import React, {useEffect, useRef, useState} from "react";
import {LogoImageStyled, LoadingStyled} from "./styles";
import {tmpServerOpenCeliumUrl} from "@entity/application/requests/classes/url";
import LogoOcWhiteImagePath from "@image/application/logo_oc_white.png";
import {Auth} from "@application/classes/Auth";
import {checkImage, convertPngUrlToBase64} from "@application/utils/utils";
import {API_REQUEST_STATE, OC_NAME} from "@application/interfaces/IApplication";
import {RootState, useAppSelector} from "@application/utils/store";

const LogoImage = (props: any) => {
    const imageRef = useRef(null);
    const {authUser} = Auth.getReduxState();
    const {updatingLogoData} = useAppSelector((state: RootState) => state.entityApplicationReducer);
    const [isLogoExist, setIsLogoExist] = useState<boolean>(null);
    const [src, setSrc] = useState<string>('');
    const logoName = authUser.logoName || OC_NAME;
    let logoPath = `${tmpServerOpenCeliumUrl}fsdlfshdfksldfdfsd-sdfjslkdfhsdlkfhfs-sdfjskdfhjsbdasdalksdhah/logo/${authUser.email}?${new Date().getTime()}`;
    useEffect(() => {
        checkImage(logoPath, () => {
            setIsLogoExist(true);
        }, () => {
            setIsLogoExist(false);
            setSrc(LogoOcWhiteImagePath);
        });
    }, [])
    useEffect(() => {
        if(isLogoExist){
            convertPngUrlToBase64(logoPath).then((data) => {
                setSrc(data);
            });
        }
    }, [isLogoExist])
    useEffect(() => {
        if(updatingLogoData === API_REQUEST_STATE.START){
            setIsLogoExist(null);
        }
        if(updatingLogoData === API_REQUEST_STATE.FINISH){
            checkImage(logoPath, () => setIsLogoExist(true), () => setIsLogoExist(false));
        }
        if(updatingLogoData === API_REQUEST_STATE.ERROR){
            setIsLogoExist(false);
        }
    }, [updatingLogoData])
    if(isLogoExist === null){
        return <LoadingStyled className={props?.className || ''}/>;
    }
    return(
        <LogoImageStyled
            ref={imageRef}
            src={src || logoPath}
            alt={logoName}
            {...props}
        />
    )
}

export default LogoImage;