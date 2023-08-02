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

import COperator from '@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator';
import React, {FC, forwardRef, useImperativeHandle, useState} from 'react';
import {
    CreatePanelStyled, CreateOperatorStyled, CreateProcessStyled,
    CreateOperatorContainerStyled, CreateProcessContainerStyled,
} from "./styles";
import {CREATE_OPERATOR, CREATE_PROCESS} from "@classes/content/connection_overview_2/CCreateElementPanel";
import {INSIDE_ITEM, OUTSIDE_ITEM} from "@classes/content/connection/CConnectorItem";

const CreatePanel: FC<{
    element: any,
    onMouseLeave: any,
    setIsCreateElementPanelOpened: any,
    sourceId: string,
    setCoordinatesForCreateElementPanel?: any,
    setCurrentItem: any,
}> = forwardRef(({element, onMouseLeave, setIsCreateElementPanelOpened, sourceId, setCoordinatesForCreateElementPanel, setCurrentItem}, ref) => {
    const [isMouseOverRight, setIsMouseOverRight] = useState<boolean>(false);
    const [isMouseOverBottom, setIsMouseOverBottom] = useState<boolean>(false);
    const isOperator = element instanceof COperator;
    const operatorPlaceholderSize = 20;
    const containerCoordinatesRight = {
        x: element.x + element.width,
        y: element.y + 10 + (isOperator ? -10 : 0) - 7.5,
    }
    const containerCoordinatesBottom = {
        x: element.x,
        y: element.y + element.height,
    }
    const points = `${operatorPlaceholderSize / 2},1 ${operatorPlaceholderSize - 1},${operatorPlaceholderSize / 2} ${operatorPlaceholderSize / 2},${operatorPlaceholderSize - 1} 1,${operatorPlaceholderSize / 2}`;

    useImperativeHandle(ref, () => ({
        createProcess(e: any, itemPosition: string, currentElement: any = null){
            setCurrentItem(currentElement || element);
            setCoordinatesForCreateElementPanel(e, CREATE_PROCESS, itemPosition);
            setIsCreateElementPanelOpened(true);
            onMouseLeave();
        },
        createOperator(e: any, itemPosition: string, currentElement: any = null){
            setCurrentItem(currentElement || element);
            setIsCreateElementPanelOpened(true);
            setCoordinatesForCreateElementPanel(e, CREATE_OPERATOR, itemPosition);
            onMouseLeave();
        }
    }));

    const createProcess = (e: any, itemPosition: string) => {
        setCurrentItem(element);
        setCoordinatesForCreateElementPanel(e, CREATE_PROCESS, itemPosition);
        setIsCreateElementPanelOpened(true);
        onMouseLeave();
    }
    const createOperator = (e: any, itemPosition: string) => {
        setCurrentItem(element);
        setIsCreateElementPanelOpened(true);
        setCoordinatesForCreateElementPanel(e, CREATE_OPERATOR, itemPosition);
        onMouseLeave();
    }
    const onMouseOverSvgRight = () => {
        if(!isMouseOverRight){
            setIsMouseOverRight(true);
        }
    }
    const onMouseLeaveSvgRight = (e: any) => {
        if(!e || (e.relatedTarget.id !== `${sourceId}_rect` && e.relatedTarget.id !== `${sourceId}_polygon`)){
            onMouseLeave(e);
        }
        if(isMouseOverRight){
            setIsMouseOverRight(false);
        }
    }
    const onMouseOverSvgBottom = () => {
        if(!isMouseOverBottom){
            setIsMouseOverBottom(true);
        }
    }
    const onMouseLeaveSvgBottom = (e: any) => {
        if(!e || (e.relatedTarget.id !== `${sourceId}_rect` && e.relatedTarget.id !== `${sourceId}_polygon`)){
            onMouseLeave(e);
        }
        if(isMouseOverBottom){
            setIsMouseOverBottom(false);
        }
    }
    return(
        <React.Fragment>
            <svg {...containerCoordinatesRight} onMouseOver={onMouseOverSvgRight} onMouseLeave={onMouseLeaveSvgRight}>
                <CreatePanelStyled id={'create_panel_right'} y={0} style={{opacity: isMouseOverRight ? 0.5 : 0.2}} isRight={true}/>
                <CreateProcessContainerStyled isRight={true}>
                    <CreateProcessStyled y={16.5} onClick={(e) => createProcess(e, OUTSIDE_ITEM)} style={{opacity: isMouseOverRight ? 1 : 0.2}} isRight={true}>
                        <title>{"Process"}</title>
                    </CreateProcessStyled>
                </CreateProcessContainerStyled>
                <CreateOperatorContainerStyled y={35} isRight={true}>
                    <CreateOperatorStyled
                        points={points}
                        onClick={(e) => createOperator(e, OUTSIDE_ITEM)}
                        style={{opacity: isMouseOverRight ? 1 : 0.2}}
                    >
                        <title>{"Operator"}</title>
                    </CreateOperatorStyled>
                </CreateOperatorContainerStyled>
            </svg>
            {isOperator &&
                <svg {...containerCoordinatesBottom} onMouseOver={onMouseOverSvgBottom} onMouseLeave={onMouseLeaveSvgBottom}>
                    <CreatePanelStyled id={'create_panel_bottom'} style={{opacity: isMouseOverBottom ? 0.5 : 0.2}} isBottom={true}/>
                    <CreateProcessContainerStyled isBottom={true}>
                        <CreateProcessStyled x={37.5} onClick={(e) => (createProcess(e, INSIDE_ITEM))} style={{opacity: isMouseOverBottom ? 1 : 0.2}} isBottom={true}>
                            <title>{"Process"}</title>
                        </CreateProcessStyled>
                    </CreateProcessContainerStyled>
                    <CreateOperatorContainerStyled x={14} isBottom={true}>
                        <CreateOperatorStyled
                            points={points}
                            onClick={(e) => createOperator(e, INSIDE_ITEM)}
                            style={{opacity: isMouseOverBottom ? 1 : 0.2}}
                        >
                            <title>{"Operator"}</title>
                        </CreateOperatorStyled>
                    </CreateOperatorContainerStyled>
                </svg>
            }
        </React.Fragment>
    )
})

export default CreatePanel;