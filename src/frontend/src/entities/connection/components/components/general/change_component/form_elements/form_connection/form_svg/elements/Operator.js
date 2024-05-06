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
import DashedElement from "@change_component/form_elements/form_connection/form_svg/elements/process/DashedElement";
import ConnectionLogs from "@application/classes/socket/ConnectionLogs";
import CreatePanel from "@change_component/form_elements/form_connection/form_svg/elements/process/CreatePanel";
import {setJustDeletedItem} from "@root/redux_toolkit/slices/ConnectionSlice";
import {toggleConditionDialog} from "@root/redux_toolkit/slices/EditorSlice";
import {setModalJustDeletedItem} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';
import DetailsForProcess
    from "@change_component/form_elements/form_connection/form_svg/layouts/button_panel/help_block/classes/DetailsForProcess";


function mapStateToProps(state, props){
    const {currentTechnicalItem, connectionOverview} = mapItemsToClasses(state, props.isModal);
    return{
        currentTechnicalItem,
        logPanelHeight: connectionOverview.logPanelHeight,
        isTestingConnection: connectionOverview.isTestingConnection,
        currentLogs: connectionOverview.currentLogs,
        justCreatedItem: connectionOverview.justCreatedItem,
        justDeletedItem: connectionOverview.justDeletedItem,
    }
}

@GetModalProp()
@connect(mapStateToProps, {setJustDeletedItem, toggleConditionDialog, setModalJustDeletedItem}, null, {forwardRef: true})
class Operator extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            polygonStyle: {},
            isMouseOverSvg: false,
            isMouseOverRightPlaceholder: false,
            isMouseOverBottomPlaceholder: false,
            isAvailableForDragging: false,
            isMouseOver: false,
            showCreatePanel: false,
        }
        this.createPanelRef = React.createRef();
        this.setJustDeletedItem = props.isModal ? props.setModalJustDeletedItem : props.setJustDeletedItem;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {operator, justCreatedItem, currentTechnicalItem} = this.props;
        if(operator && justCreatedItem && currentTechnicalItem){
            if(currentTechnicalItem.entity.index !== justCreatedItem.index){
                if(this.isJustCreatedItem()){
                    this.onClick();
                }
            }
        }
    }

    isJustCreatedItem(){
        const {operator, justCreatedItem} = this.props;
        if(operator && justCreatedItem){
            return operator.entity.index === justCreatedItem.index
                && operator.connectorType === justCreatedItem.connectorType;
        }
        return false;
    }

    isJustDeletedItem(){
        const {operator, justDeletedItem} = this.props;
        if(operator && justDeletedItem){
            return operator.entity.index === justDeletedItem.index
                && operator.connectorType === justDeletedItem.connectorType;
        }
        return false;
    }

    onMouseOverSvg(){
        const {currentTechnicalItem, operator, isCreateElementPanelOpened} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        const isItemOver = isCurrentItemDragged && !this.state.isMouseOverSvg && currentTechnicalItem.entity.index !== operator.entity.index;
        if(isItemOver){
            this.setState({
                isMouseOverSvg: true,
            })
        }
        if(!this.state.isMouseOver){
            this.setState({
                isMouseOver: true,
            }, () => {
                setTimeout(() => {
                    if(this.state.isMouseOver && !this.state.showCreatePanel && !operator.isDragged && !isCreateElementPanelOpened && !isItemOver && !(isCurrentItemDragged && currentTechnicalItem.entity.index === operator.entity.index)){
                        this.setState({
                            showCreatePanel: true,
                        })
                    }
                }, 100)
            })
        }
    }

    onMouseLeaveSvg(e){
        if(this.state.isMouseOverSvg) {
            this.setState({
                isMouseOverSvg: false,
            })
        }
        if(this.state.isMouseOver){
            if(!e || (e.relatedTarget.id !== 'create_panel_right' && e.relatedTarget.id !== 'create_panel_bottom')) {
                this.setState({
                    isMouseOver: false,
                    showCreatePanel: false,
                })
            }
        }
    }

    onMouseOverRightPlaceholder(){
        const {currentTechnicalItem, connection, operator, isItemDraggable} = this.props;
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        if(isItemDraggable && isCurrentItemDragged && !this.state.isMouseOverRightPlaceholder && currentTechnicalItem.entity.index !== operator.entity.index){
            const isOperator = currentTechnicalItem instanceof COperator;
            const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);
            let isAvailableForDragging = connector.areIndexesUnderScope(operator.entity, currentTechnicalItem.entity, OUTSIDE_ITEM, currentTechnicalItem.isSelectedAll);
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
            let isAvailableForDragging = connector.areIndexesUnderScope(operator.entity, currentTechnicalItem.entity, INSIDE_ITEM, currentTechnicalItem.isSelectedAll);
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
        const {connection, setCurrentItem, operator, isDisabled, isItemDraggable, currentTechnicalItem, readOnly} = this.props;
        if(!isDisabled && !readOnly) {
            if (connection) {
                if(isItemDraggable){
                    operator.isDragged = true;
                    operator.isDraggedForCopy = e.altKey;
                    if(this.state.showCreatePanel){
                        this.setState({
                            showCreatePanel: false,
                        })
                    }
                }
                if(currentTechnicalItem && currentTechnicalItem.index === operator.index){
                    operator.isSelectedAll = currentTechnicalItem.isSelectedAll;
                }
                setCurrentItem(operator);
            }
        }
    }

    onMouseUp(){
        const {connection, setCurrentItem, operator, isDisabled, readOnly} = this.props;
        if(!isDisabled && !readOnly) {
            if (connection) {
                operator.isDragged = false;
                setCurrentItem(operator);
            }
        }
    }

    onClick(){
        const {setCurrentItem, operator, isDisabled} = this.props;
        if(!isDisabled) {
            setCurrentItem(operator);
        }
    }

    onDoubleClick(){
        this.onClick();
        this.props.formConnectionSvg.detailsRef.current.descriptionRef.current.conditionRef.current.toggleEdit();
        //this.props.toggleConditionDialog();
    }

    deleteOperator(e){
        const {connection, operator, updateConnection, setCurrentItem} = this.props;
        const connector = connection.getConnectorByType(operator.connectorType);
        this.setState({
            showCreatePanel: false,
        })
        this.setJustDeletedItem({index: operator.entity.index, connectorType: operator.connectorType});
        setTimeout(() => {
            this.setJustDeletedItem(null);
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
        }, 450);
        if(e){
            e.stopPropagation();
        }
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
        const {
            operator, isNotDraggable, isCurrent, currentTechnicalItem,
            isHighlighted, readOnly, isDisabled, logPanelHeight,
            currentLogs, isTestingConnection, justDeletedItem,
        } = this.props;
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
        const currentLog = currentLogs.length > 0 ? currentLogs[currentLogs.length - 1] : null;
        const hasDashAnimation = logPanelHeight !== 0 && currentLog
            && (currentLog.message !== ConnectionLogs.BreakMessage || (currentLog.message === ConnectionLogs.BreakMessage && currentLog.operatorData && !currentLog.operatorData.conditionResult) && currentLog.message !== ConnectionLogs.EndOfExecutionMessage)
            && currentLog.index === operator.entity.index && currentLog.connectorType === operator.connectorType && currentLog.message !== '';
        const hasDeleteIcon = isCurrent && !readOnly && !isTestingConnection;
        const logStroke = logPanelHeight !== 0 && currentLogs.findIndex(l => l.index === operator.entity.index && l.connectorType === operator.connectorType) !== -1 ? '#58854d' : '';
        const isJustCreatedItem = this.isJustCreatedItem();
        const isJustDeletedItem = this.isJustDeletedItem() || !!justDeletedItem && isHighlighted;
        return(
            <svg onMouseOver={(a) => this.onMouseOverSvg(a)} onMouseLeave={(a) => this.onMouseLeaveSvg(a)} id={operator.getHtmlIdName()} x={operator.x} y={operator.y} className={`${styles.operator} ${isDisabledStyle} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={svgSize.width} height={svgSize.height}>
                <rect x={0} y={0} width={svgSize.width} height={svgSize.height} fill={'transparent'} id={`${operator.getHtmlIdName()}_rect`}/>
                {operatorType === IF_OPERATOR &&
                    <React.Fragment>
                        <DashedElement
                            hasDashAnimation={hasDashAnimation}
                            getElement={(props) => {
                                return <polygon
                                    onMouseDown={(a) => this.onMouseDown(a)}
                                    onMouseUp={(a) => this.onMouseUp(a)}
                                    onClick={() => this.onClick()}
                                    onDoubleClick={() => this.onDoubleClick()}
                                    points={points}
                                    style={{...polygonStyle, ...errorStyles}}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                                    id={`${operator.getHtmlIdName()}_polygon`}
                                    {...props}
                                />;
                            }}
                            stroke={logStroke}
                        />
                        <text fontSize={20} dominantBaseline={"middle"} textAnchor={"middle"} className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_label}`} x={textX} y={textY} style={errorStyles}>
                        {'if'}
                        </text>
                        <title>{'if'}</title>
                    </React.Fragment>
                }
                {operatorType === LOOP_OPERATOR &&
                    <React.Fragment>
                        <DashedElement
                            hasDashAnimation={hasDashAnimation}
                            getElement={(props) => {
                                return <polygon
                                    onMouseDown={(a) => this.onMouseDown(a)}
                                    onMouseUp={(a) => this.onMouseUp(a)}
                                    onClick={() => this.onClick()}
                                    onDoubleClick={() => this.onDoubleClick()}
                                    points={points}
                                    style={{...polygonStyle, ...errorStyles}}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                                    id={`${operator.getHtmlIdName()}_polygon`}
                                    {...props}
                                />
                            }}
                            stroke={logStroke}
                        />
                        <svg style={{pointerEvents: 'none'}} className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`} fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                            <path style={errorStyles} d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                            <path d="M0 0h24v24H0z" fill="none"/>
                        </svg>
                        <text style={errorStyles} dominantBaseline={"middle"} textAnchor={"middle"} className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_label}`} x={'40'} y={'42'}>
                            {operator.entity.iterator}
                        </text>
                        <title>
                            {'loop'}
                        </title>
                    </React.Fragment>
                }
                {hasDeleteIcon &&
                    <DeleteIcon isJustCreatedItem={isJustCreatedItem} isJustDeletedItem={isJustDeletedItem} svgX={closeX} svgY={closeY} onClick={(a) => this.deleteOperator(a)}/>
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
        const {showCreatePanel} = this.state;
        const {type, setIsCreateElementPanelOpened, operator, setCoordinatesForCreateElementPanel, setCurrentItem} = this.props;
        return(
            <React.Fragment>
                {this.renderOperator(type)}
                {showCreatePanel &&
                    <CreatePanel
                        ref={this.createPanelRef}
                        element={operator}
                        onMouseLeave={(a) => this.onMouseLeaveSvg(a)}
                        setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                        sourceId={`${operator.getHtmlIdName()}`}
                        setCoordinatesForCreateElementPanel={setCoordinatesForCreateElementPanel}
                        setCurrentItem={setCurrentItem}
                    />
                }
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
