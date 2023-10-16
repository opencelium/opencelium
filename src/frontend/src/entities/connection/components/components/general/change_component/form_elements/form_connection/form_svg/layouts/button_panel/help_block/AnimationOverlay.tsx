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
import {
    AnimationOverlayStyled, PauseOverlayContainer, EditOverlayContainer,
    ActionContainer, LabelContainer,
} from './styles';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {setAnimationPaused, setIsEditableAnimation} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {useAppDispatch} from "@application/utils/store";
import {withTheme} from "styled-components";
import {ITheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import FontIcon from "@entity/connection/components/components/general/basic_components/FontIcon";
const AnimationOverlay: FC<{theme?: ITheme}> = ({theme}) => {
    const dispatch = useAppDispatch();
    const { videoAnimationName } = Connection.getReduxState();
    const { isAnimationPaused, isEditableAnimation } = ModalConnection.getReduxState();
    const [onMouseOverContainer, setOnMouseOverContainer] = useState<boolean>(false);
    const [showLabelContainer, toggleLabelContainer] = useState<boolean>(false);
    const onMouseOver = () => {
        if(!onMouseOverContainer){
            setOnMouseOverContainer(true);
        }
    }
    const onMouseLeave = () => {
        if(onMouseOverContainer){
            setOnMouseOverContainer(false);
            toggleLabelContainer(false);
        }
    }
    const onClick = () => {
        dispatch(setIsEditableAnimation(true));
        toggleLabelContainer(false);
    }
    const hintLabel = <b style={{marginRight: '5px'}}>{"Hint: "}</b>;
    const inProcessLabel: any = <div style={{display: 'flex'}}>
        <span>{`if you want to break the animation, please press `}</span>
        <FontIcon value={'pause'}/>
    </div>;
    const onPauseLabel = <div style={{display: 'flex'}}>
        <span>{`if you want to continue the animation, please press `}</span>
        <FontIcon value={'play_arrow'}/>
        <span>{` or press `}</span>
        <FontIcon value={'stop'}/>
        <span>{` to exit`}</span>
    </div>;
    return(
        <React.Fragment>
            <ActionContainer onMouseOverContainer={onMouseOverContainer} isAnimationPaused={isAnimationPaused} isVisible={!!((!isAnimationPaused || !isEditableAnimation) && videoAnimationName)} onMouseOver={onMouseOver} onMouseLeave={onMouseLeave}>
                <PauseOverlayContainer onClick={() => {toggleLabelContainer(false); dispatch(setAnimationPaused(!isAnimationPaused))}}>
                    <TooltipFontIcon size={50} value={isAnimationPaused ? 'play_arrow' : 'pause'} tooltip={isAnimationPaused ? 'Play' : 'Pause'}/>
                </PauseOverlayContainer>
                {isAnimationPaused && <EditOverlayContainer onClick={onClick}>
                    <TooltipFontIcon size={50} value={'stop'} tooltip={'Stop'}/>
                </EditOverlayContainer>}
            </ActionContainer>
            {onMouseOverContainer && <LabelContainer size={TextSize.Size_16} value={<span style={{display: 'flex'}}>{hintLabel}{isAnimationPaused ? onPauseLabel : inProcessLabel}</span>}/>}
            <AnimationOverlayStyled onClick={() => {onMouseOver(); toggleLabelContainer(true)}} isVisible={!!((!isAnimationPaused || !isEditableAnimation) && videoAnimationName)} onMouseOverContainer={onMouseOverContainer}/>
        </React.Fragment>
    )
}

export default withTheme(AnimationOverlay);
