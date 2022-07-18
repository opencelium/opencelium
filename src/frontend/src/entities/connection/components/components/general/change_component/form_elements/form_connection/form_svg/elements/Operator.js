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
import CConnectorItem, {
    CONNECTOR_FROM, INSIDE_ITEM,
    OUTSIDE_ITEM
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {connect} from "react-redux";
import {setCurrentBusinessItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {IF_OPERATOR, LOOP_OPERATOR} from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import {SvgItem} from "@entity/connection/components/decorators/SvgItem";
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

@connect(mapStateToProps, {setCurrentBusinessItem})
@SvgItem(COperator)
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
        const {currentTechnicalItem, connection, operator} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isCurrentItemDragged && !this.state.isMouseOverSvg && currentTechnicalItem.entity.index !== operator.entity.index){
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            const allReferences = isOperator ? connector.getReferencesForOperator(currentTechnicalItem.entity) : currentTechnicalItem.entity.getReferences();
            let isAvailableForDragging = CConnectorItem.areIndexesUnderScope(operator.entity, connector.convertReferencesToIndexes(allReferences));
            if(isAvailableForDragging){
                if(isOperator && currentTechnicalItem){
                    if(operator.entity.index.indexOf(currentTechnicalItem.entity.index) === 0){
                        isAvailableForDragging = false;
                    }
                }
            }
            this.setState({
                isMouseOverSvg: true,
                isAvailableForDragging,
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

    onMouseOver(){
        const {connection} = this.props;
        if(connection && connection.businessLayout.isInAssignMode) {
            this.setState({
                polygonStyle: {stroke: '#79c883'},
            });
        }
    }

    onMouseOverRightPlaceholder(){
        if(!this.state.isMouseOverRightPlaceholder){
            this.setState({
                isMouseOverRightPlaceholder: true,
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
        if(!this.state.isMouseOverBottomPlaceholder){
            this.setState({
                isMouseOverBottomPlaceholder: true,
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

    onMouseDown(){
        const {connection, setCurrentItem, operator, isDisabled} = this.props;
        if(!isDisabled) {
            if (connection) {
                operator.isDragged = true;
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

    onMouseLeave(){
        const {connection} = this.props;
        if(connection && connection.businessLayout.isInAssignMode) {
            this.setState({
                polygonStyle: {},
            });
        }
    }

    onDoubleClick(){
        this.props.setIsCreateElementPanelOpened(true);
    }

    onClick(){
        const {connection, setCurrentItem, operator, isDisabled, assign, toggleReassignConfirmation} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        if(!isDisabled) {
            if (isAssignMode) {
                assign();
            } else {
                setCurrentItem(operator);
            }
        } else{
            if (isAssignMode) {
                toggleReassignConfirmation();
            }
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
        const {connection, operator, isNotDraggable, isCurrent, currentTechnicalItem, isHighlighted, readOnly, isAssignedToBusinessProcess, isDisabled} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
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
        const textX = '30';
        const textY = '30';
        const closeX = 40;
        const closeY = 0;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        const assignStyle = isAssignMode && isAssignedToBusinessProcess ? styles.assigned_operator : '';
        const isDisabledStyle = isDisabled ? styles.disabled_operator : '';
        const hasDraggableItem = currentTechnicalItem && currentTechnicalItem.isDragged;
        const hasDraggableOperator = isCurrent && hasDraggableItem;
        const isDraggableItemOperator = hasDraggableItem && currentTechnicalItem instanceof CTechnicalOperator;
        return(
            <svg onMouseOver={(a) => this.onMouseOverSvg(a)} onMouseLeave={(a) => this.onMouseLeaveSvg(a)} id={operator.getHtmlIdName()} x={operator.x} y={operator.y} className={`${styles.operator} ${assignStyle} ${isDisabledStyle} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={svgSize.width} height={svgSize.height}>
                <rect x={0} y={0} width={svgSize.width} height={svgSize.height} fill={'transparent'}/>
                {operatorType === IF_OPERATOR &&
                    <React.Fragment>
                        <polygon onMouseDown={(a) => this.onMouseDown(a)} onMouseUp={(a) => this.onMouseUp(a)} onMouseOver={(a) => this.onMouseOver(a)} onMouseLeave={(a) => this.onMouseLeave(a)} onDoubleClick={(a) => this.onDoubleClick(a)} onClick={(a) => this.onClick(a)} points={points} style={polygonStyle} className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}/>
                        <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                        {'if'}
                        </text>
                        <title>{'if'}</title>
                    </React.Fragment>
                }
                {operatorType === LOOP_OPERATOR &&
                    <React.Fragment>
                        <polygon onMouseDown={(a) => this.onMouseDown(a)} onMouseUp={(a) => this.onMouseUp(a)} onMouseOver={(a) => this.onMouseOver(a)} onMouseLeave={(a) => this.onMouseLeave(a)} onDoubleClick={(a) => this.onDoubleClick(a)} onClick={(a) => this.onClick(a)} style={polygonStyle} className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} points={points}/>
                        <svg style={{pointerEvents: 'none'}} className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`} fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                            <path d="M0 0h24v24H0z" fill="none"/>
                        </svg>
                        <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={'40'} y={'42'}>
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
                        <polygon id={'draggable_operator'} className={styles.draggable_operator}/>, document.getElementById('technical_layout_svg')
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
};

export default Operator;