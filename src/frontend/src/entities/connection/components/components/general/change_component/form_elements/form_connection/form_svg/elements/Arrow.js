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

import React from 'react';
import PropTypes from 'prop-types';
import CCoordinates from "@entity/connection/components/classes/components/content/connection_overview_2/CCoordinates";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {connect} from "react-redux";
import COperator from "@classes/content/connection_overview_2/operator/COperator";
import {INSIDE_ITEM, OUTSIDE_ITEM} from "@classes/content/connection/CConnectorItem";
import DashedElement from "@change_component/form_elements/form_connection/form_svg/elements/process/DashedElement";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import COperatorItem from "@classes/content/connection/operator/COperatorItem";

export const ARROW_WIDTH = 2;


function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        currentTechnicalItem,
        currentLogs: connectionOverview.currentLogs,
        logPanelHeight: connectionOverview.logPanelHeight,
        justDeletedItem: connectionOverview.justDeletedItem,
    }
}

@connect(mapStateToProps, {})
class Arrow extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isMouseOver: false,
            isAvailableForDragging: false,
            dashAnimation: '4,8,4',
        }
    }

    onMouseOver(){
        const {from, to, currentTechnicalItem, connection, isItemDraggable} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isItemDraggable && isCurrentItemDragged && !this.state.isMouseOver && currentTechnicalItem.entity.index !== from.entity.index && currentTechnicalItem.entity.index !== to.entity.index){
            let {line1, line2, arrow} = CCoordinates.getLinkCoordinates(from, to);
            const isInsideDirection = line1 !== null && line2 !== null;
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            let isAvailableForDragging = connector.areIndexesUnderScope(from.entity, currentTechnicalItem.entity, isInsideDirection ? INSIDE_ITEM : OUTSIDE_ITEM, currentTechnicalItem.isSelectedAll);
            if(isAvailableForDragging){
                if(isOperator && currentTechnicalItem){
                    if(from.entity.index.indexOf(currentTechnicalItem.entity.index) === 0){
                        isAvailableForDragging = false;
                    }
                }
            }
            this.setState({
                isMouseOver: true,
                isAvailableForDragging,
            })
        }
    }

    onMouseLeave(){
        if(this.state.isMouseOver){
            this.setState({
                isMouseOver: false,
            })
        }
    }

    getPrevItemLog(){
        const {currentLogs} = this.props;
        let prevLog = null;
        const currentLog = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
        if(currentLog){
            for(let i = currentLogs.length - 1; i >= 0; i--){
                if(currentLogs[i].index !== currentLog.index){
                    return currentLogs[i];
                }
            }
        }
        return prevLog;
    }

    render(){
        const {isMouseOver, isAvailableForDragging} = this.state;
        const {from, to, isHighlighted, isDisabled, currentTechnicalItem, currentLogs, logPanelHeight, justDeletedItem} = this.props;
        if(!from || !to){
            return null;
        }
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        const isDraggedInfoAvailable = isCurrentItemDragged && currentTechnicalItem.entity.index !== from.entity.index && currentTechnicalItem.entity.index !== to.entity.index;
        const isDraggableItemOver = isMouseOver && isCurrentItemDragged && from.connectorType === currentTechnicalItem.connectorType;
        const isOperator = isDraggableItemOver ? currentTechnicalItem instanceof COperator : false;
        let {line1, line2, arrow} = CCoordinates.getLinkCoordinates(from, to);
        const isDisabledStyle = isDisabled ? styles.disabled_arrow : '';
        const showPlaceholder = isDraggableItemOver && currentTechnicalItem.entity.index !== from.entity.index && currentTechnicalItem.entity.index !== to.entity.index;
        const processPlaceholderX = line1 === null ? arrow.x1 - 15 + (arrow.x2 - arrow.x1) / 2 : line1.x1 - 15 + (arrow.x2 - line1.x1) / 2;
        const processPlaceholderY = line1 === null ? arrow.y1 - 10 + (arrow.y2 - arrow.y1) / 2 : line1.y1 - 10 + (arrow.y2 - line1.y1) / 2;
        const aroundConst = 40;
        const processPlaceholderBackgroundCoord = {x: line1 ? line1.x1 - aroundConst : arrow.x1 - aroundConst, y: line1 ? line1.y1 - aroundConst : arrow.y1 - aroundConst, width: line1 ? arrow.x2 - line1.x1 + aroundConst * 2 : arrow.x2 - arrow.x1 + aroundConst * 2, height: line1 ? arrow.y2 - line1.y1 + aroundConst * 2 : arrow.y2 - arrow.y1 + aroundConst * 2};
        let markerStyle = isHighlighted ? '_highlighted' : '';
        const isInsideDirection = line1 !== null && line2 !== null;
        const isRejectedPlaceholder = isDraggableItemOver && !isAvailableForDragging;
        let stroke = '#000';
        if(showPlaceholder){
            markerStyle = '_placeholder';
            stroke = '#00acc2';
        }
        if(showPlaceholder && isRejectedPlaceholder){
            markerStyle = '_rejected_placeholder';
            stroke = '#d24545';
        }
        const prevItemLog = this.getPrevItemLog();
        const currentLog = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
        let hasDashAnimation = currentLog && currentLog.message === ConnectionLogs.BreakMessage
            && `${from.id}_${to.id}` === `${currentLog.connectorType}_${currentLog.index}_${to.id}`;
        let hasDashAnimationHorizontal = false;
        let hasDashAnimationVertical = false;
        const isArrowVertical = arrow.x1 === arrow.x2;
        const isArrowHorizontal = arrow.y1 === arrow.y2;
        let hasArrowAlert = false;
        if(from && from.entity instanceof COperatorItem){
            if(hasDashAnimation){
                if(currentLog?.operatorData?.isNextMethodOutside){
                    hasDashAnimationHorizontal = true;
                } else{
                    hasDashAnimationVertical = true;
                }
            }
        } else{
            hasDashAnimationHorizontal = hasDashAnimation;
        }
        let hasArrowDashAnimation = hasDashAnimationHorizontal && isArrowHorizontal || line1 && hasDashAnimationVertical && isArrowVertical;
        if(hasArrowDashAnimation){
            markerStyle = '_dashed';
        }
        if(from && from.entity instanceof COperatorItem){
            if(currentLog && `${from.id}_${to.id}` === `${currentLog.connectorType}_${currentLog.index}_${to.id}`){
                if(isArrowVertical && currentLog.operatorData && currentLog.operatorData.conditionResult === false){
                    stroke = '#d24545';
                    hasArrowAlert = true;
                    markerStyle = '_rejected_placeholder';
                }
            }
        }
        let logStroke = '';
        if(logPanelHeight !== 0) {
            const logsWithoutLastItem = currentLogs.filter(l => l.index !== currentLog.index);
            for (let i = 0; i < logsWithoutLastItem.length; i++) {
                if (from.id === `${logsWithoutLastItem[i].connectorType}_${logsWithoutLastItem[i].index}`) {
                    if (isArrowVertical && logsWithoutLastItem[i].operatorData && logsWithoutLastItem[i].operatorData.conditionResult === false) {
                        logStroke = '#d24545';
                        hasArrowAlert = true;
                        markerStyle = '_rejected_placeholder';
                    } else {
                        logStroke = '#58854d';
                        markerStyle = '_dashed';
                    }
                    break;
                }
            }
            if(isArrowVertical) {
                const logsWithFalseConditionResult = currentLogs.filter(l => l.operatorData && l.operatorData.conditionResult === false);
                for (let i = 0; i < logsWithFalseConditionResult.length; i++) {
                    if (from.id === `${logsWithFalseConditionResult[i].connectorType}_${logsWithFalseConditionResult[i].index}`) {
                        logStroke = '#d24545';
                        hasArrowAlert = true;
                        markerStyle = '_rejected_placeholder';
                        break;
                    }
                }
            }
        }
        const isJustDeletedItem = justDeletedItem ? from.id === `${justDeletedItem.connectorType}_${justDeletedItem.index}` || to.id === `${justDeletedItem.connectorType}_${justDeletedItem.index}` || isHighlighted : false;
        if(isJustDeletedItem){
            debugger;
        }
        return(
            <React.Fragment>
                {line1 &&
                    <React.Fragment>
                        <DashedElement
                            hasArrowAlert={hasArrowAlert}
                            hasDashAnimation={hasDashAnimationVertical}
                            stroke={logStroke}
                            getElement={(props) => {
                                return <line
                                    {...props}
                                    id={`${from.id}_${to.id}_line1`}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isDisabledStyle} ${isHighlighted ? styles.highlighted_arrow : ''} line1`}
                                    x1={line1.x1} y1={line1.y1} x2={line1.x2} y2={line1.y2}
                                    stroke={stroke}
                                    strokeWidth={ARROW_WIDTH}
                                />
                            }}
                        />
                        {hasArrowAlert &&
                            <React.Fragment>
                                <line
                                    id={`${from.id}_${to.id}_line1_alert`}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isDisabledStyle}`}
                                    x1={line1.x1 - 10} y1={line1.y1 + 20} x2={line1.x2 + 10} y2={line1.y2} stroke={'#d24545'}
                                    strokeWidth={ARROW_WIDTH}
                                />
                                <line
                                    id={`${from.id}_${to.id}_line1_alert`}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isDisabledStyle}`}
                                    x1={line1.x1 - 10} y1={line1.y1 + 40} x2={line1.x2 + 10} y2={line1.y2 - 20} stroke={'#d24545'}
                                    strokeWidth={ARROW_WIDTH}
                                />
                            </React.Fragment>
                        }
                    </React.Fragment>
                }
                {/*{line2 &&
                    <DashedElement
                        hasDashAnimation={hasDashAnimationVertical}
                        getElement={(props) => {
                            return <line
                                {...props}
                                id={`${from.id}_${to.id}_line2`}
                                className={`${isDisabledStyle} ${isHighlighted ? styles.highlighted_arrow : ''} line2`}
                                x1={line2.x1} y1={line2.y1} x2={line2.x2} y2={line2.y2} stroke={stroke}
                                strokeLinecap={"round"} strokeWidth={ARROW_WIDTH}
                            />
                        }}
                    />
                }*/}
                {arrow &&
                    <DashedElement
                        hasArrowAlert={hasArrowAlert}
                        hasDashAnimation={hasArrowDashAnimation}
                        getElement={(props) => {
                            return <line
                                {...props}
                                id={`${from.id}_${to.id}_arrow`}
                                className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isDisabledStyle} ${isHighlighted ? styles.highlighted_arrow : ''} arrow`}
                                x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2}
                                stroke={stroke}
                                strokeWidth={ARROW_WIDTH} markerEnd={`url(#arrow_head_right${markerStyle})`}
                            />
                        }}
                        stroke={logStroke}
                    />
                }
                {showPlaceholder ?
                    !isOperator ?
                        <rect className={styles.process_placeholder} stroke={stroke} rx={5} ry={5} x={processPlaceholderX} y={processPlaceholderY} width={30} height={20}/>
                    :
                        <polygon className={styles.operator_placeholder} stroke={stroke} points={COperator.getPoints(processPlaceholderX, processPlaceholderY - 5, 30)}/>
                    : null
                }
                {showPlaceholder && isRejectedPlaceholder &&
                    <React.Fragment>
                        <rect fill={'#fff'} x={processPlaceholderX - 12} y={processPlaceholderY + 25} width={60} height={10}>
                            {'dependency'}
                        </rect>
                        <text dominantBaseline={"middle"} textAnchor={"middle"} fill={stroke} fontSize={'10px'} x={processPlaceholderX + 18} y={processPlaceholderY + 30}>
                            {'dependency'}
                        </text>
                    </React.Fragment>
                }
                <rect id={`arrow_from__${from.id}__${isInsideDirection ? INSIDE_ITEM : OUTSIDE_ITEM}`} data-movable={isAvailableForDragging} onMouseOver={() => this.onMouseOver()} onMouseLeave={() => this.onMouseLeave()} className={styles.process_placeholder_background} {...processPlaceholderBackgroundCoord}/>
            </React.Fragment>
        );
    }
}

Arrow.propTypes = {
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
    isHighlighted: PropTypes.bool,
    isDisabled: PropTypes.bool,
};

Arrow.defaultProps = {
    isHighlighted: false,
    isDisabled: false,
    isItemDraggable: false,
};

export default Arrow;