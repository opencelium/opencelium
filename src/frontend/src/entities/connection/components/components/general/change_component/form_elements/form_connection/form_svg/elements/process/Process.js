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
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import styles from "../../../../../../../../themes/default/content/connections/connection_overview_2.scss";
import {CTechnicalProcess} from "@classes/content/connection_overview_2/process/CTechnicalProcess";
import {isString} from "@application/utils/utils";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {COLOR_MODE} from "@classes/content/connection_overview_2/CSvg";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import ReactDOM from "react-dom";
import {ARROW_WIDTH} from "@change_component/form_elements/form_connection/form_svg/elements/Arrow";
import COperator from "@classes/content/connection_overview_2/operator/COperator";
import {CTechnicalOperator} from "@classes/content/connection_overview_2/operator/CTechnicalOperator";
import {OUTSIDE_ITEM} from "@classes/content/connection/CConnectorItem";
import DashedElement from "./DashedElement";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import CreatePanel from "@change_component/form_elements/form_connection/form_svg/elements/process/CreatePanel";
import {setJustDeletedItem} from "@root/redux_toolkit/slices/ConnectionSlice";
import {toggleBodyDialog} from "@root/redux_toolkit/slices/EditorSlice";

function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        isTestingConnection: connectionOverview.isTestingConnection,
        colorMode: connectionOverview.colorMode,
        logPanelHeight: connectionOverview.logPanelHeight,
        textSize: connectionOverview.processTextSize,
        currentLogs: connectionOverview.currentLogs,
        justCreatedItem: connectionOverview.justCreatedItem,
        justDeletedItem: connectionOverview.justDeletedItem,
        currentTechnicalItem,
    }
}

@connect(mapStateToProps, {setJustDeletedItem, toggleBodyDialog})
class Process extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            technicalRectClassName: '',
            isMouseOverPlaceholder: false,
            isAvailableForDragging: false,
            isMouseOverSvg: false,
            isMouseOver: false,
            showCreatePanel: false,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {process, justCreatedItem, currentTechnicalItem} = this.props;
        if(process && justCreatedItem && currentTechnicalItem){
            if(currentTechnicalItem.entity.index !== justCreatedItem.index){
                if(this.isJustCreatedItem()){
                    this.onClick();
                }
            }
        }
    }

    isJustCreatedItem(){
        const {process, justCreatedItem} = this.props;
        if(process && justCreatedItem){
            return process.entity.index === justCreatedItem.index
                && process.connectorType === justCreatedItem.connectorType;
        }
        return false;
    }

    isJustDeletedItem(){
        const {process, justDeletedItem} = this.props;
        if(process && justDeletedItem){
            return process.entity.index === justDeletedItem.index
                && process.connectorType === justDeletedItem.connectorType;
        }
        return false;
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

    onMouseOverSvg(e){
        const {currentTechnicalItem, connection, process, isItemDraggable, isCreateElementPanelOpened} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        const isItemOver = isItemDraggable && isCurrentItemDragged && !this.state.isMouseOverSvg && currentTechnicalItem.entity.index !== process.entity.index;
        if(!this.state.isMouseOver){
            this.setState({
                isMouseOver: true,
            }, () => {
                setTimeout(() => {
                    if(this.state.isMouseOver && !this.state.showCreatePanel && !isCreateElementPanelOpened && !isItemOver && !(isCurrentItemDragged && currentTechnicalItem.entity.index === process.entity.index)){
                        this.setState({
                            showCreatePanel: true,
                        })
                    }
                }, 100)
            })
        }
        if(isItemOver){
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            let isAvailableForDragging = connector.areIndexesUnderScope(process.entity, currentTechnicalItem.entity, OUTSIDE_ITEM, currentTechnicalItem.isSelectedAll);
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

    onMouseLeaveSvg(e){
        if(this.state.isMouseOverSvg){
            this.setState({
                isMouseOverSvg: false,
            })
        }
        if(this.state.isMouseOver){
            if(!e || e.relatedTarget.id !== 'create_panel_right') {
                this.setState({
                    isMouseOver: false,
                    showCreatePanel: false,
                })
            }
        }
    }

    onMouseDown(e){
        const {
            connection, setCurrentItem, process, isDisabled, isItemDraggable,
            currentTechnicalItem, readOnly
        } = this.props;
        if(!isDisabled && !readOnly) {
            if (connection) {
                if(isItemDraggable){
                    process.isDragged = true;
                    process.isDraggedForCopy = e.altKey;
                    if(this.state.showCreatePanel){
                        this.setState({
                            showCreatePanel: false,
                        })
                    }
                }
                if(currentTechnicalItem && currentTechnicalItem.index === process.index){
                    process.isSelectedAll = currentTechnicalItem.isSelectedAll;
                }
                setCurrentItem(process);
            }
        }
    }

    onClick(){
        const {setCurrentItem, process, isDisabled} = this.props;
        if(!isDisabled) {
            process.isDragged = false;
            setCurrentItem(process);
        }
    }

    onDoubleClick(){
        this.onClick();
        this.props.toggleBodyDialog();
    }

    deleteProcess(e){
        const {deleteProcess, process, setJustDeletedItem} = this.props;
        setJustDeletedItem({index: process.entity.index, connectorType: process.connectorType});
        this.setState({
            showCreatePanel: false,
        })
        setTimeout(() => {
            setJustDeletedItem(null);
            deleteProcess(process);
        }, 450)
        if(e){
            e.stopPropagation();
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
        const {
            technicalRectClassName, isMouseOverSvg, isMouseOverPlaceholder,
            isAvailableForDragging, showCreatePanel,
        } = this.state;
        const {
            process, isNotDraggable, isCurrent, isHighlighted, currentLogs,logPanelHeight,
            isDisabled, colorMode, readOnly, connection, currentTechnicalItem, textSize,
            isTestingConnection, setIsCreateElementPanelOpened, setCoordinatesForCreateElementPanel,
            setCurrentItem, justDeletedItem,
        } = this.props;
        const isRejectedPlaceholder = currentTechnicalItem && !isAvailableForDragging;
        const method = process.entity;
        const borderRadius = 10;
        const labelX = '50%';
        const labelY = '50%';
        const closeX = process.width - 15;
        const closeY = 15;
        const methodName = method ? method.label ? method.label : method.name ? method.name : '' : '';
        let label = methodName === '' ? isString(process.name) ? process.name : '' : methodName;
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
        if(isString(label) && label.length > ((20 - textSize) * 2 + 12)){
            shortLabel = `${label.substring(0, (20 - textSize) * 2 + 9)}...`;
        }
        //shortLabel = method.color;
        const isDisabledStyle = isDisabled ? styles.disabled_process : '';
        const hasDraggableItem = isCurrent && currentTechnicalItem && currentTechnicalItem.isDragged;
        const isSelected = isCurrent && !readOnly;
        const hasDeleteIcon = isSelected && !isTestingConnection;
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
        const currentLog = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
        const prevLog = currentLogs.length > 1 ? currentLogs[currentLogs.length - 2] : null;
        // || (currentLog.message === ConnectionLogs.BreakMessage && prevLog && !prevLog.hasNextItem)
        const hasDashAnimation = logPanelHeight !== 0 && currentLog
            && currentLog.shouldDraw && ((currentLog.message !== ConnectionLogs.BreakMessage && currentLog.message !== ConnectionLogs.EndOfExecutionMessage))
            && currentLog.index === process.entity.index && currentLog.connectorType === process.connectorType && currentLog.message !== '';
        const logStroke = logPanelHeight !== 0 && currentLogs.findIndex(l => l.shouldDraw && l.index === process.entity.index && l.connectorType === process.connectorType) !== -1 ? '#58854d' : '';
        const isJustCreatedItem = this.isJustCreatedItem();
        const isJustDeletedItem = this.isJustDeletedItem() || !!justDeletedItem && isHighlighted;
        return(
            <React.Fragment>
                <svg id={process.getHtmlIdName()} data-movable={isAvailableForDragging} onMouseOver={(a) => this.onMouseOverSvg(a)} onMouseLeave={(a) => this.onMouseLeaveSvg(a)} x={process.x} y={process.y} className={`${isDisabledStyle} ${isHighlighted && !isCurrent ? styles.highlighted_process : ''} confine`} width={svgSize.width} height={svgSize.height}>
                    <rect rx={borderRadius} ry={borderRadius} x={0} y={0} width={svgSize.width} height={svgSize.height} fill={'transparent'}/>
                    <DashedElement
                        getElement={(props) => {
                            return (
                                <rect
                                    {...props}
                                    id={`${process.getHtmlIdName()}_rect`}
                                    fill={colorMode !== COLOR_MODE.BACKGROUND || !hasColor ? '#fff' : color}
                                    onClick={() => this.onClick()}
                                    onDoubleClick={() => this.onDoubleClick()}
                                    onMouseDown={(a) => {this.onMouseDown(a)}}
                                    x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${technicalRectClassName} ${styles.process_rect} ${isCurrent ? styles.current_process : ''} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                                />);
                        }}
                        hasDashAnimation={hasDashAnimation}
                        stroke={logStroke}
                    />
                    <svg x={0} y={0} width={process.width} height={process.height}>
                        <text dominantBaseline={"middle"} textAnchor={"middle"} className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_label}`} x={labelX} y={labelY} fontSize={textSize}>
                            {shortLabel}
                        </text>
                    </svg>
                    <title>{label}</title>
                    {hasColor && colorMode === COLOR_MODE.RECTANGLE_TOP && <rect className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_color_rect}`} fill={color} x={10} y={5} width={isSelected && !isTestingConnection ? 95 : 110} height={15} rx={5} ry={5}/>}
                    {hasColor && colorMode === COLOR_MODE.CIRCLE_LEFT_TOP && <circle className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_color_circle}`} cx={15} cy={15} r="10" fill={color}/>}
                    {hasDeleteIcon &&
                        <DeleteIcon isJustDeletedItem={isJustDeletedItem} isJustCreatedItem={isJustCreatedItem} svgX={105} svgY={2} x={closeX} y={closeY} onClick={(a) => this.deleteProcess(a)}/>
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
                        <React.Fragment>
                            <svg id={'draggable_process'} x={process.x} y={process.y}>
                                <rect className={styles.draggable_process} rx={borderRadius} ry={borderRadius} width={process.width} height={process.height}/>
                                {currentTechnicalItem.isDraggedForCopy && <svg xmlns="http://www.w3.org/2000/svg" x={process.width - 20} width={20} height={20}>
                                    <path x={20} stroke={"#00acc2"} d="M4.5 18q-.625 0-1.062-.438Q3 17.125 3 16.5V5h1.5v11.5H14V18Zm3-3q-.625 0-1.062-.438Q6 14.125 6 13.5v-10q0-.625.438-1.062Q6.875 2 7.5 2h8q.625 0 1.062.438Q17 2.875 17 3.5v10q0 .625-.438 1.062Q16.125 15 15.5 15Zm0-1.5h8v-10h-8v10Zm0 0v-10 10Z"/>
                                </svg>}
                            </svg>
                        </React.Fragment>,
                        document.getElementById('technical_layout_svg')
                    )
                }
                {showCreatePanel &&
                    <CreatePanel
                        element={process}
                        onMouseLeave={(a) => this.onMouseLeaveSvg(a)}
                        setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                        sourceId={`${process.getHtmlIdName()}`}
                        setCoordinatesForCreateElementPanel={setCoordinatesForCreateElementPanel}
                        setCurrentItem={setCurrentItem}
                    />
                }
            </React.Fragment>
        );
    }
}

Process.propTypes = {
    process: PropTypes.instanceOf(CTechnicalProcess),
    deleteProcess: PropTypes.func.isRequired,
    isNotDraggable: PropTypes.bool,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
    isDisabled: PropTypes.bool,
    isCreateElementPanelOpened: PropTypes.bool,
};

Process.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
    isDisabled: false,
    isItemDraggable: false,
};

export default Process;
