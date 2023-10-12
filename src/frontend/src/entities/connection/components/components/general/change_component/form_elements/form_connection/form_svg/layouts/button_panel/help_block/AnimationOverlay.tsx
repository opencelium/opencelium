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


import React, {FC, useEffect, useState} from "react";
import {Connection} from "@root/classes/Connection";
import {ModalConnection} from "@root/classes/ModalConnection";
import {AnimationOverlayStyled, PauseOverlayContainer} from './styles';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {setAnimationPaused} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {useAppDispatch} from "@application/utils/store";
const AnimationOverlay: FC = () => {
    const dispatch = useAppDispatch();
    const { videoAnimationName } = Connection.getReduxState();
    const { isAnimationPaused } = ModalConnection.getReduxState();
    const [onMouseOverContainer, setOnMouseOverContainer] = useState<boolean>(false);
    const onMouseOver = () => {
        if(!onMouseOverContainer){
            setOnMouseOverContainer(true);
        }
    }
    const onMouseLeave = () => {
        if(onMouseOverContainer){
            setOnMouseOverContainer(false);
        }
    }
    return(
        <React.Fragment>
            <PauseOverlayContainer isVisible={!!(!isAnimationPaused && videoAnimationName)} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave} onClick={() => dispatch(setAnimationPaused(!isAnimationPaused))}>
                <TooltipFontIcon size={50} value={'pause'} tooltip={'Pause'}/>
            </PauseOverlayContainer>
            <AnimationOverlayStyled isVisible={!!(!isAnimationPaused && videoAnimationName)} onMouseOverContainer={onMouseOverContainer}/>
        </React.Fragment>
    )
}

export default AnimationOverlay;
