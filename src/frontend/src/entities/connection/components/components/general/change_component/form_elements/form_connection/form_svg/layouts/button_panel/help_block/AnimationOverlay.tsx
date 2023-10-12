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
import {setAnimationPaused, setIsEditableAnimation} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {useAppDispatch} from "@application/utils/store";
const AnimationOverlay: FC = () => {
    const dispatch = useAppDispatch();
    const { videoAnimationName } = Connection.getReduxState();
    const { isAnimationPaused, isEditableAnimation } = ModalConnection.getReduxState();
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
    const onClick = () => {
        if(!isAnimationPaused){
            dispatch(setAnimationPaused(true));
        } else{
            dispatch(setIsEditableAnimation(true));
        }
    }
    return(
        <React.Fragment>
            <PauseOverlayContainer isVisible={!!((!isAnimationPaused || !isEditableAnimation) && videoAnimationName)} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave} onClick={onClick}>
                <TooltipFontIcon size={50} value={!isAnimationPaused ? 'pause' : 'edit'} tooltip={!isAnimationPaused ? 'Pause' : 'Edit'}/>
            </PauseOverlayContainer>
            <AnimationOverlayStyled isVisible={!!((!isAnimationPaused || !isEditableAnimation) && videoAnimationName)} onMouseOverContainer={onMouseOverContainer}/>
        </React.Fragment>
    )
}

export default AnimationOverlay;
