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
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {CBusinessProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {isString} from "@application/utils/utils";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {setCurrentBusinessItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {AssignIcon} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";
import {SvgItem} from "@entity/connection/components/decorators/SvgItem";
import CProcess from "@entity/connection/components/classes/components/content/connection_overview_2/process/CProcess";
import {BUSINESS_LABEL_MODE, COLOR_MODE} from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import CBusinessLayout from "@entity/connection/components/classes/components/content/connection_overview_2/CBusinessLayout";
import ReactDOM from "react-dom";
import {ARROW_WIDTH} from "@change_component/form_elements/form_connection/form_svg/elements/Arrow";
import COperator from "@classes/content/connection_overview_2/operator/COperator";
import {CTechnicalOperator} from "@classes/content/connection_overview_2/operator/CTechnicalOperator";
import CConnectorItem, {INSIDE_ITEM, OUTSIDE_ITEM} from "@classes/content/connection/CConnectorItem";

function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {currentBusinessItem, currentTechnicalItem} = mapItemsToClasses(state);
    return{
        colorMode: connectionOverview.colorMode,
        businessLabelMode: connectionOverview.businessLabelMode,
        isVisibleBusinessLabelKeyPressed: connectionOverview.isVisibleBusinessLabelKeyPressed,
        currentBusinessItem,
        currentTechnicalItem,
    }
}

@connect(mapStateToProps, {setCurrentBusinessItem})
@SvgItem(CProcess)
class Process extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            technicalRectClassName: '',
            isMouseOverSvg: false,
            isMouseOverPlaceholder: false,
            isAvailableForDragging: false,
        }
    }

    onMouseOverPlaceholder(){
        if(!this.state.isMouseOverPlaceholder){
            this.setState({
                isMouseOverPlaceholder: true,
            })
        }
    }

    onMouseLeavePlaceholder(){
        if(this.state.isMouseOverPlaceholder) {
            this.setState({
                isMouseOverPlaceholder: false,
            })
        }
    }

    onMouseOverSvg(){
        const {currentTechnicalItem, connection, process, isItemDraggable} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isItemDraggable && isCurrentItemDragged && !this.state.isMouseOverSvg && currentTechnicalItem.entity.index !== process.entity.index){
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            let isAvailableForDragging = connector.areIndexesUnderScope(process.entity, currentTechnicalItem.entity, OUTSIDE_ITEM);
            if(isAvailableForDragging){
                if(isOperator && currentTechnicalItem){
                    if(process.entity.index.indexOf(currentTechnicalItem.entity.index) === 0){
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
        if(this.state.isMouseOverSvg){
            this.setState({
                isMouseOverSvg: false,
            })
        }
    }

    onMouseOver(){
        const {connection, process} = this.props;
        if(connection && connection.businessLayout.isInAssignMode && process instanceof CTechnicalProcess) {
            this.setState({
                technicalRectClassName: styles.process_assign,
            });
        }
    }

    onMouseDown(){
        const {connection, setCurrentItem, process, isDisabled, isItemDraggable} = this.props;
        if(!isDisabled) {
            if (connection && !connection.businessLayout.isInAssignMode) {
                if(isItemDraggable){
                    process.isDragged = true;
                }
                setCurrentItem(process);
            }
        }
    }

    onMouseLeave(){
        const {connection, process} = this.props;
        if(connection && connection.businessLayout.isInAssignMode && process instanceof CTechnicalProcess) {
            this.setState({
                technicalRectClassName: '',
            });
        }
    }

    onDoubleClick(){
        const {isDisabled, connection} = this.props;
        if(!isDisabled && connection && !connection.businessLayout.isInAssignMode) {
            this.props.setIsCreateElementPanelOpened(true);
        }
    }

    onClick(){
        const {connection, setCurrentItem, process, assign, isDisabled, toggleReassignConfirmation} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        if(!isDisabled) {
            if (isAssignMode) {
                assign();
            } else {
                process.isDragged = false;
                setCurrentItem(process);
            }
        } else{
            const isBusinessProcess = process instanceof CBusinessProcess;
            if (isAssignMode && !isBusinessProcess) {
                toggleReassignConfirmation();
            }
        }
    }

    deleteProcess(e){
        const {deleteProcess, process} = this.props;
        deleteProcess(process);
        e.stopPropagation();
    }

    setAssignMode(){
        const {connection, updateConnection} = this.props;
        if(connection){
            connection.businessLayout.isInAssignMode = true;
            updateConnection(connection);
        }
    }

    shouldShowPlaceholder(){
        const {isMouseOverSvg} = this.state;
        const {connection, currentTechnicalItem, isCurrent, process} = this.props;
        const connector = connection.getConnectorByType(process.connectorType);
        const hasNextItem = !!connector.getNextOutsideItem(process.entity);
        return isMouseOverSvg && !hasNextItem && !isCurrent && currentTechnicalItem && currentTechnicalItem.isDragged && process.connectorType === currentTechnicalItem.connectorType;
    }

    render(){
        const {technicalRectClassName, isMouseOverSvg, isMouseOverPlaceholder, isAvailableForDragging} = this.state;
        const {
            process, isNotDraggable, isCurrent, isHighlighted, isAssignedToBusinessProcess,
            isDisabled, colorMode, readOnly, businessLabelMode, connection,
            isVisibleBusinessLabelKeyPressed, currentBusinessItem, currentTechnicalItem,
        } = this.props;
        const isRejectedPlaceholder = currentTechnicalItem && !isAvailableForDragging;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        const method = process.entity;
        const borderRadius = 10;
        const labelX = '50%';
        const labelY = '50%';
        const closeX = process.width - 15;
        const closeY = 15;
        const assignX = process.width - 45;
        const assignY = 15;
        const methodName = method ? method.label ? method.label : method.name ? method.name : '' : '';
        let label = methodName === '' ? isString(process.name) ? process.name : '' : methodName;
        if(!isAssignMode && process instanceof CTechnicalProcess){
            let businessItem = null;
            switch (businessLabelMode){
                case BUSINESS_LABEL_MODE.NOT_VISIBLE:
                    break;
                case BUSINESS_LABEL_MODE.VISIBLE:
                case BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY:
                    if(businessLabelMode === BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY){
                        if(!isVisibleBusinessLabelKeyPressed){
                            break;
                        }
                    }
                    businessItem = connection ? connection.businessLayout.getItemByTechnicalItem(process) : null;
                    if(businessItem){
                        label = businessItem.name;
                    } else{
                        label = '';
                    }
                    break;
            }
        }
        let stroke = '#5d5b5b';
        if(isMouseOverPlaceholder){
            if(isRejectedPlaceholder){
                stroke = '#d24545';
            } else{
                stroke = '#00acc2';
            }
        }
        const color = method ? method.color : '';
        let hasColor = color !== '';
        let shortLabel = label;
        if(isString(label) && label.length > 12){
            shortLabel = `${label.substr(0, 9)}...`;
        }
        //shortLabel = method.index;
        const assignedStyle = isAssignMode && isAssignedToBusinessProcess ? styles.assigned_process : '';
        const hasAssignIcon = isCurrent && !readOnly && process instanceof CBusinessProcess;
        const isDisabledStyle = isDisabled ? styles.disabled_process : '';
        const isBusinessItem = CBusinessLayout.isInstanceOfBusinessItem(process);
        const hasDraggableItem = isCurrent && currentBusinessItem && currentBusinessItem.isDragged && isBusinessItem || isCurrent && currentTechnicalItem && currentTechnicalItem.isDragged;
        const isSelected = isCurrent && !readOnly;
        const hasDeleteIcon = isSelected;
        const showPlaceholder = this.shouldShowPlaceholder();
        const isDraggableItemOperator = showPlaceholder && currentTechnicalItem instanceof CTechnicalOperator;
        const svgSize = {
            width: process.width,
            height: process.height,
        }
        if(isMouseOverSvg){
            if(showPlaceholder){
                svgSize.width += 90;
            }
        }
        return(
            <React.Fragment>
                <svg id={process.getHtmlIdName()} data-movable={isAvailableForDragging} onMouseOver={(a) => this.onMouseOverSvg(a)} onMouseLeave={(a) => this.onMouseLeaveSvg(a)} x={process.x} y={process.y} className={`${isDisabledStyle} ${isHighlighted && !isCurrent ? styles.highlighted_process : ''} confine`} width={svgSize.width} height={svgSize.height}>
                    <rect rx={borderRadius} ry={borderRadius} x={0} y={0} width={svgSize.width} height={svgSize.height} fill={'transparent'}/>
                    <rect fill={colorMode !== COLOR_MODE.BACKGROUND || !hasColor ? '#fff' : color} onDoubleClick={(a) => this.onDoubleClick(a)} onClick={(a) => this.onClick(a)} onMouseOver={(a) => this.onMouseOver(a)} onMouseDown={(a) => this.onMouseDown(a)} onMouseLeave={(a) => this.onMouseLeave(a)} x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2}
                          className={`${technicalRectClassName} ${styles.process_rect} ${assignedStyle} ${isCurrent ? styles.current_process : ''} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                    />
                    <svg x={0} y={0} width={process.width} height={process.height}>
                        <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={labelX} y={labelY}>
                            {shortLabel}
                        </text>
                    </svg>
                    <title>{label}</title>
                    {hasColor && colorMode === COLOR_MODE.RECTANGLE_TOP && <rect className={styles.process_color_rect} fill={color} x={10} y={5} width={isSelected ? 95 : 110} height={15} rx={5} ry={5}/>}
                    {hasColor && colorMode === COLOR_MODE.CIRCLE_LEFT_TOP && <circle className={styles.process_color_circle} cx={15} cy={15} r="10" fill={color}/>}
                    {hasDeleteIcon &&
                        <DeleteIcon svgX={105} svgY={2} x={closeX} y={closeY} onClick={(a) => this.deleteProcess(a)}/>
                    }
                    {hasAssignIcon &&
                        <AssignIcon svgX={85} svgY={2} x={assignX} y={assignY} onClick={(a) => this.setAssignMode(a)}/>
                    }
                    {
                        showPlaceholder
                            ?
                            <React.Fragment>
                                <line x1={process.width} y1={process.height / 2} x2={process.width + 20} y2={process.height / 2} stroke={stroke} strokeWidth={ARROW_WIDTH}/>
                                {
                                    isDraggableItemOperator
                                        ?
                                        <polygon
                                            id={`arrow_from__${process.id}`}
                                            data-movable={isAvailableForDragging}
                                            onMouseOver={(a) => this.onMouseOverPlaceholder(a)}
                                            onMouseLeave={(a) => this.onMouseLeavePlaceholder(a)}
                                            className={isMouseOverPlaceholder ? isRejectedPlaceholder ? styles.operator_placeholder_over_rejected : styles.operator_placeholder_over : styles.operator_placeholder_leave}
                                            stroke={stroke}
                                            points={COperator.getPoints(process.width + 20, 25, 30)}
                                        />
                                        :
                                        <rect
                                            id={`arrow_from__${process.id}`}
                                            data-movable={isAvailableForDragging}
                                            onMouseOver={(a) => this.onMouseOverPlaceholder(a)}
                                            onMouseLeave={(a) => this.onMouseLeavePlaceholder(a)}
                                            className={isMouseOverPlaceholder ? isRejectedPlaceholder ? styles.operator_placeholder_over_rejected : styles.operator_placeholder_over : styles.operator_placeholder_leave}
                                            stroke={stroke}
                                            rx={5} ry={5}
                                            x={process.width + 20}
                                            y={30}
                                            width={30}
                                            height={20}
                                        />
                                }
                                {isMouseOverPlaceholder && isRejectedPlaceholder &&
                                    <text dominantBaseline={"middle"} textAnchor={"middle"} fill={stroke} fontSize={'10px'} x={process.width + 35} y={60}>
                                        {'dependency'}
                                    </text>
                                }
                            </React.Fragment>
                            :
                            null
                    }
                </svg>
                {hasDraggableItem &&
                    ReactDOM.createPortal(
                        <rect id={'draggable_process'} className={styles.draggable_process} rx={borderRadius} ry={borderRadius} x={process.x} y={process.y} width={process.width} height={process.height}/>, document.getElementById(isBusinessItem ? 'business_layout_svg' : 'technical_layout_svg')
                    )
                }
            </React.Fragment>
        );
    }
}

Process.propTypes = {
    process: PropTypes.oneOfType([
        PropTypes.instanceOf(CBusinessProcess),
        PropTypes.instanceOf(CTechnicalProcess),
    ]),
    deleteProcess: PropTypes.func.isRequired,
    isNotDraggable: PropTypes.bool,
    setCurrentBusinessItem: PropTypes.func,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
    isAssignedToBusinessProcess: PropTypes.bool,
    isDisabled: PropTypes.bool,
};

Process.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
    isAssignedToBusinessProcess: false,
    isDisabled: false,
    isItemDraggable: false,
};

export default Process;