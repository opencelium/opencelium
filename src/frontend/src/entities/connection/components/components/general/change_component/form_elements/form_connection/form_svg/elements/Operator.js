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

import React from 'react';
import PropTypes from 'prop-types';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {CTechnicalOperator} from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import {
    CONNECTOR_FROM, INSIDE_ITEM,
    OUTSIDE_ITEM
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {connect} from "react-redux";
import {IF_OPERATOR, LOOP_OPERATOR} from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";
import ReactDOM from "react-dom";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {ARROW_WIDTH} from "@change_component/form_elements/form_connection/form_svg/elements/Arrow";


function mapStateToProps(state){
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        currentTechnicalItem,
    }
}

@connect(mapStateToProps, {})
class Operator extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            polygonStyle: {},
            isMouseOverSvg: false,
            isMouseOverRightPlaceholder: false,
            isMouseOverBottomPlaceholder: false,
            isAvailableForDragging: false,
        }
    }

    onMouseOverSvg(){
        const {currentTechnicalItem, operator} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isCurrentItemDragged && !this.state.isMouseOverSvg && currentTechnicalItem.entity.index !== operator.entity.index){
            this.setState({
                isMouseOverSvg: true,
            })
        }
    }

    onMouseLeaveSvg(){
        if(this.state.isMouseOverSvg) {
            this.setState({
                isMouseOverSvg: false,
            })
        }
    }

    onMouseOverRightPlaceholder(){
        const {currentTechnicalItem, connection, operator, isItemDraggable} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isItemDraggable && isCurrentItemDragged && !this.state.isMouseOverRightPlaceholder && currentTechnicalItem.entity.index !== operator.entity.index){
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            let isAvailableForDragging = connector.areIndexesUnderScope(operator.entity, currentTechnicalItem.entity, OUTSIDE_ITEM);
            if(isAvailableForDragging){
                if(isOperator && currentTechnicalItem){
                    if(operator.entity.index.indexOf(currentTechnicalItem.entity.index) === 0){
                        isAvailableForDragging = false;
                    }
                }
            }
            this.setState({
                isMouseOverRightPlaceholder: true,
                isAvailableForDragging,
            })
        }
    }

    onMouseLeaveRightPlaceholder(){
        if(this.state.isMouseOverRightPlaceholder) {
            this.setState({
                isMouseOverRightPlaceholder: false,
            })
        }
    }

    onMouseOverBottomPlaceholder(){
        const {currentTechnicalItem, connection, operator, isItemDraggable} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isItemDraggable && isCurrentItemDragged && !this.state.isMouseOverBottomPlaceholder && currentTechnicalItem.entity.index !== operator.entity.index){
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            let isAvailableForDragging = connector.areIndexesUnderScope(operator.entity, currentTechnicalItem.entity, INSIDE_ITEM);
            if(isAvailableForDragging){
                if(isOperator && currentTechnicalItem){
                    if(operator.entity.index.indexOf(currentTechnicalItem.entity.index) === 0){
                        isAvailableForDragging = false;
                    }
                }
            }
            this.setState({
                isMouseOverBottomPlaceholder: true,
                isAvailableForDragging,
            })
        }
    }

    onMouseLeaveBottomPlaceholder(){
        if(this.state.isMouseOverBottomPlaceholder) {
            this.setState({
                isMouseOverBottomPlaceholder: false,
            })
        }
    }

    onMouseDown(e){
        const {connection, setCurrentItem, operator, isDisabled, isItemDraggable} = this.props;
        if(!isDisabled) {
            if (connection) {
                if(isItemDraggable){
                    operator.isDragged = true;
                    operator.isDraggedForCopy = e.altKey;
                }
                setCurrentItem(operator);
            }
        }
    }

    onMouseUp(){
        const {connection, setCurrentItem, operator, isDisabled} = this.props;
        if(!isDisabled) {
            if (connection) {
                operator.isDragged = false;
                setCurrentItem(operator);
            }
        }
    }

    onDoubleClick(){
        this.props.setIsCreateElementPanelOpened(true);
    }

    onClick(){
        const {setCurrentItem, operator, isDisabled} = this.props;
        if(!isDisabled) {
            setCurrentItem(operator);
        }
    }

    deleteOperator(e){
        const {connection, operator, updateConnection, setCurrentItem} = this.props;
        const connector = connection.getConnectorByType(operator.connectorType);
        if(connector){
            if(connector.getConnectorType() === CONNECTOR_FROM){
                connection.removeFromConnectorOperator(operator.entity);
            } else{
                connection.removeToConnectorOperator(operator.entity);
            }
            updateConnection(connection);
            const currentItem = connector.getCurrentItem();
            if(currentItem){
                const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                setCurrentItem(currentSvgElement);
            }
        }
        e.stopPropagation();
    }

    shouldShowRightPlaceholder(){
        const {isMouseOverSvg} = this.state;
        const {connection, currentTechnicalItem, isCurrent, operator} = this.props;
        const connector = connection.getConnectorByType(operator.connectorType);
        const hasNextItem = !!connector.getNextOutsideItem(operator.entity);
        return isMouseOverSvg && !hasNextItem && !isCurrent && currentTechnicalItem && currentTechnicalItem.isDragged && operator.connectorType === currentTechnicalItem.connectorType;
    }

    shouldShowBottomPlaceholder(){
        const {isMouseOverSvg} = this.state;
        const {connection, currentTechnicalItem, isCurrent, operator} = this.props;
        const connector = connection.getConnectorByType(operator.connectorType);
        const hasNextItem = !!connector.getNextInsideItemForOperator(operator.entity);
        return isMouseOverSvg && !hasNextItem && !isCurrent && currentTechnicalItem && currentTechnicalItem.isDragged && operator.connectorType === currentTechnicalItem.connectorType;
    }

    renderOperator(operatorType){
        const {polygonStyle, isMouseOverSvg, isMouseOverBottomPlaceholder, isMouseOverRightPlaceholder, isAvailableForDragging} = this.state;
        const {operator, isNotDraggable, isCurrent, currentTechnicalItem, isHighlighted, readOnly, isDisabled} = this.props;
        const hasBottomPlaceholder = this.shouldShowBottomPlaceholder();
        const hasRightPlaceholder = this.shouldShowRightPlaceholder();
        const isRejectedPlaceholder = currentTechnicalItem && !isAvailableForDragging;
        const svgExtraSize = 90;
        const svgSize = {
            width: operator.width,
            height: operator.height,
        }
        if(isMouseOverSvg){
            if(hasBottomPlaceholder){
                svgSize.height += svgExtraSize;
            }
            if(hasRightPlaceholder){
                svgSize.width += svgExtraSize;
            }
        }
        let bottomStroke = '#5d5b5b';
        if(isMouseOverBottomPlaceholder){
            if(isRejectedPlaceholder){
                bottomStroke = '#d24545';
            } else{
                bottomStroke = '#00acc2';
            }
        }
        let rightStroke = '#5d5b5b';
        if(isMouseOverRightPlaceholder){
            if(isRejectedPlaceholder){
                rightStroke = '#d24545';
            } else{
                rightStroke = '#00acc2';
            }
        }
        const errorStyles = {};
        if(operator.entity.error.hasError){
            errorStyles.stroke = '#d24545';
        }
        const textX = '30';
        const textY = '30';
        const closeX = 40;
        const closeY = 0;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        const isDisabledStyle = isDisabled ? styles.disabled_operator : '';
        const hasDraggableItem = currentTechnicalItem && currentTechnicalItem.isDragged;
        const hasDraggableOperator = isCurrent && hasDraggableItem;
        const isDraggableItemOperator = hasDraggableItem && currentTechnicalItem instanceof CTechnicalOperator;
        return(
            <svg onMouseOver={(a) => this.onMouseOverSvg(a)} onMouseLeave={(a) => this.onMouseLeaveSvg(a)} id={operator.getHtmlIdName()} x={operator.x} y={operator.y} className={`${styles.operator} ${isDisabledStyle} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={svgSize.width} height={svgSize.height}>
                <rect x={0} y={0} width={svgSize.width} height={svgSize.height} fill={'transparent'}/>
                {operatorType === IF_OPERATOR &&
                    <React.Fragment>
                        <polygon onMouseDown={(a) => this.onMouseDown(a)} onMouseUp={(a) => this.onMouseUp(a)} onDoubleClick={(a) => this.onDoubleClick(a)} onClick={(a) => this.onClick(a)} points={points} style={{...polygonStyle, ...errorStyles}} className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}/>
                        <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY} style={errorStyles}>
                        {'if'}
                        </text>
                        <title>{'if'}</title>
                    </React.Fragment>
                }
                {operatorType === LOOP_OPERATOR &&
                    <React.Fragment>
                        <polygon onMouseDown={(a) => this.onMouseDown(a)} onMouseUp={(a) => this.onMouseUp(a)} onDoubleClick={(a) => this.onDoubleClick(a)} onClick={(a) => this.onClick(a)} style={{...polygonStyle, ...errorStyles}} className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} points={points}/>
                        <svg style={{pointerEvents: 'none'}} className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`} fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                            <path style={errorStyles} d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                            <path d="M0 0h24v24H0z" fill="none"/>
                        </svg>
                        <text style={errorStyles} dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={'40'} y={'42'}>
                            {operator.entity.iterator}
                        </text>
                        <title>
                            {'loop'}
                        </title>
                    </React.Fragment>
                }
                {isCurrent && !readOnly &&
                    <DeleteIcon svgX={closeX} svgY={closeY} onClick={(a) => this.deleteOperator(a)}/>
                }
                {
                    hasBottomPlaceholder
                    ?
                        <React.Fragment>
                            <line x1={operator.width / 2} y1={operator.height} x2={operator.width / 2} y2={operator.height + 20} stroke={bottomStroke} strokeWidth={ARROW_WIDTH}/>
                            {
                                isDraggableItemOperator
                                    ?
                                    <polygon
                                        id={`arrow_from__${operator.id}__${INSIDE_ITEM}`}
                                        data-movable={isAvailableForDragging}
                                        onMouseOver={(a) => this.onMouseOverBottomPlaceholder(a)}
                                        onMouseLeave={(a) => this.onMouseLeaveBottomPlaceholder(a)}
                                        className={isMouseOverBottomPlaceholder ? isRejectedPlaceholder ? styles.operator_placeholder_over_rejected : styles.operator_placeholder_over : styles.operator_placeholder_leave}
                                        stroke={bottomStroke}
                                        points={COperator.getPoints(15, 80, 30)}
                                    />
                                    :
                                    <rect
                                        id={`arrow_from__${operator.id}__${INSIDE_ITEM}`}
                                        data-movable={isAvailableForDragging}
                                        onMouseOver={(a) => this.onMouseOverBottomPlaceholder(a)}
                                        onMouseLeave={(a) => this.onMouseLeaveBottomPlaceholder(a)}
                                        className={isMouseOverBottomPlaceholder ? isRejectedPlaceholder ? styles.operator_placeholder_over_rejected : styles.operator_placeholder_over : styles.operator_placeholder_leave}
                                        stroke={bottomStroke}
                                        rx={5} ry={5}
                                        x={15}
                                        y={80}
                                        width={30}
                                        height={20}
                                    />
                            }
                            {isMouseOverBottomPlaceholder && isRejectedPlaceholder &&
                                <text dominantBaseline={"middle"} textAnchor={"middle"} fill={bottomStroke} x={30} y={110} className={styles.dependency_text}>
                                    {'dependency'}
                                </text>
                            }
                        </React.Fragment>
                    :
                        null
                }
                {
                    hasRightPlaceholder
                    ?
                        <React.Fragment>
                            <line x1={operator.width} y1={operator.height / 2} x2={operator.width + 20} y2={operator.height / 2} stroke={rightStroke} strokeWidth={ARROW_WIDTH}/>
                            {
                                isDraggableItemOperator
                                    ?
                                    <polygon
                                        id={`arrow_from__${operator.id}__${OUTSIDE_ITEM}`}
                                        data-movable={isAvailableForDragging}
                                        onMouseOver={(a) => this.onMouseOverRightPlaceholder(a)}
                                        onMouseLeave={(a) => this.onMouseLeaveRightPlaceholder(a)}
                                        className={isMouseOverRightPlaceholder ? isRejectedPlaceholder ? styles.operator_placeholder_over_rejected : styles.operator_placeholder_over : styles.operator_placeholder_leave}
                                        stroke={rightStroke}
                                        points={COperator.getPoints(80, 15, 30)}
                                    />
                                    :
                                    <rect
                                        id={`arrow_from__${operator.id}__${OUTSIDE_ITEM}`}
                                        data-movable={isAvailableForDragging}
                                        onMouseOver={(a) => this.onMouseOverRightPlaceholder(a)}
                                        onMouseLeave={(a) => this.onMouseLeaveRightPlaceholder(a)}
                                        className={isMouseOverRightPlaceholder ? isRejectedPlaceholder ? styles.operator_placeholder_over_rejected : styles.operator_placeholder_over : styles.operator_placeholder_leave}
                                        stroke={rightStroke}
                                        rx={5} ry={5}
                                        x={80}
                                        y={20}
                                        width={30}
                                        height={20}
                                    />
                            }
                            {isMouseOverRightPlaceholder && isRejectedPlaceholder &&
                                <text dominantBaseline={"middle"} textAnchor={"middle"} fill={rightStroke} className={styles.dependency_text} x={95} y={50}>
                                    {'dependency'}
                                </text>
                            }
                        </React.Fragment>
                    :
                        null
                }
                {hasDraggableOperator &&
                    ReactDOM.createPortal(
                        <svg id={'draggable_operator'} x={operator.x} y={operator.y}>
                            <polygon className={styles.draggable_operator} points={points}/>
                            {currentTechnicalItem.isDraggedForCopy && <svg xmlns="http://www.w3.org/2000/svg" x={operator.width - 20} width={20} height={20}>
                                <path x={20} stroke={"#00acc2"} d="M4.5 18q-.625 0-1.062-.438Q3 17.125 3 16.5V5h1.5v11.5H14V18Zm3-3q-.625 0-1.062-.438Q6 14.125 6 13.5v-10q0-.625.438-1.062Q6.875 2 7.5 2h8q.625 0 1.062.438Q17 2.875 17 3.5v10q0 .625-.438 1.062Q16.125 15 15.5 15Zm0-1.5h8v-10h-8v10Zm0 0v-10 10Z"/>
                            </svg>}
                        </svg>
                        , document.getElementById('technical_layout_svg')
                    )
                }
            </svg>
        );
    }

    render(){
        const {type} = this.props;
        return(
            <React.Fragment>
                {this.renderOperator(type)}
            </React.Fragment>
        );
    }
}

Operator.propTypes = {
    operator: PropTypes.oneOfType([
        PropTypes.instanceOf(CTechnicalOperator),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
    isDisabled: PropTypes.bool,
};

Operator.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
    isDisabled: false,
    isItemDraggable: false,
};

export default Operator;