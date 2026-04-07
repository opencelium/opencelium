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
import { CTechnicalOperator } from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import {
    CONNECTOR_FROM,
    INSIDE_ITEM,
    OUTSIDE_ITEM
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import { connect } from "react-redux";
import { IF_OPERATOR, LOOP_OPERATOR } from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";
import ReactDOM from "react-dom";
import { mapItemsToClasses } from "@change_component/form_elements/form_connection/form_svg/utils";
import { ARROW_WIDTH } from "@change_component/form_elements/form_connection/form_svg/elements/Arrow";
import DashedElement from "@change_component/form_elements/form_connection/form_svg/elements/process/DashedElement";
import CreatePanel from "@change_component/form_elements/form_connection/form_svg/elements/process/CreatePanel";
import { LogPanelHeight, setJustDeletedItem } from "@root/redux_toolkit/slices/ConnectionSlice";
import { setModalJustDeletedItem } from "@root/redux_toolkit/slices/ModalConnectionSlice";
import GetModalProp from '@entity/connection/components/decorators/GetModalProp';

function mapStateToProps(state, props) {
    const { currentTechnicalItem, connectionOverview } = mapItemsToClasses(state, props.isModal);
    const { currentLog, currentDirection } = state.connectionLogReducer;

    return {
        currentLog,
        currentDirection,
        currentTechnicalItem,
        logPanelHeight: connectionOverview.logPanelHeight,
        isTestingConnection: connectionOverview.isTestingConnection,
        currentLogs: connectionOverview.currentLogs,
        justCreatedItem: connectionOverview.justCreatedItem,
        justDeletedItem: connectionOverview.justDeletedItem,
    };
}

@GetModalProp()
@connect(
    mapStateToProps,
    { setJustDeletedItem, setModalJustDeletedItem },
    null,
    { forwardRef: true }
)
class Operator extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            polygonStyle: {},
            isMouseOverSvg: false,
            isMouseOverRightPlaceholder: false,
            isMouseOverBottomPlaceholder: false,
            isAvailableForDragging: false,
            isMouseOver: false,
            showCreatePanel: false,
        };

        this.createPanelRef = React.createRef();
        this.createPanelTimer = null;
        this.deleteTimer = null;
        this.isUnmounted = false;

        this.setJustDeletedItem = props.isModal ? props.setModalJustDeletedItem : props.setJustDeletedItem;
    }

    componentDidUpdate(prevProps) {
        const { operator, justCreatedItem, currentTechnicalItem } = this.props;

        if (
            operator &&
            justCreatedItem &&
            currentTechnicalItem &&
            (justCreatedItem !== prevProps.justCreatedItem || currentTechnicalItem !== prevProps.currentTechnicalItem)
        ) {
            if (currentTechnicalItem.entity.index !== justCreatedItem.index) {
                if (this.isJustCreatedItem()) {
                    this.onClick();
                }
            }
        }
    }

    componentWillUnmount() {
        this.isUnmounted = true;
        this.clearCreatePanelTimer();
        this.clearDeleteTimer();
    }

    clearCreatePanelTimer = () => {
        if (this.createPanelTimer) {
            clearTimeout(this.createPanelTimer);
            this.createPanelTimer = null;
        }
    };

    clearDeleteTimer = () => {
        if (this.deleteTimer) {
            clearTimeout(this.deleteTimer);
            this.deleteTimer = null;
        }
    };

    setStateIfChanged = (nextState, callback) => {
        const hasChanges = Object.keys(nextState).some((key) => this.state[key] !== nextState[key]);
        if (hasChanges) {
            this.setState(nextState, callback);
        } else if (callback) {
            callback();
        }
    };

    isJustCreatedItem() {
        const { operator, justCreatedItem } = this.props;
        if (operator && justCreatedItem) {
            return (
                operator.entity.index === justCreatedItem.index &&
                operator.connectorType === justCreatedItem.connectorType
            );
        }
        return false;
    }

    isJustDeletedItem() {
        const { operator, justDeletedItem } = this.props;
        if (operator && justDeletedItem) {
            return (
                operator.entity.index === justDeletedItem.index &&
                operator.connectorType === justDeletedItem.connectorType
            );
        }
        return false;
    }

    scheduleCreatePanel = ({ isItemOver, isCurrentItemDragged }) => {
        const {
            isCreateElementPanelOpened,
            currentTechnicalItem,
            operator,
            readOnly,
        } = this.props;

        if (readOnly) return;

        this.clearCreatePanelTimer();

        this.createPanelTimer = setTimeout(() => {
            if (this.isUnmounted) return;

            const shouldOpen =
                this.state.isMouseOver &&
                !this.state.showCreatePanel &&
                !operator.isDragged &&
                !isCreateElementPanelOpened &&
                !isItemOver &&
                !(isCurrentItemDragged && currentTechnicalItem?.entity.index === operator.entity.index);

            if (shouldOpen) {
                this.setStateIfChanged({
                    showCreatePanel: true,
                });
            }
        }, 100);
    };

    onMouseEnterSvg = () => {
        const { currentTechnicalItem, operator, readOnly } = this.props;
        if (readOnly) return;

        const isCurrentItemDragged = !!(currentTechnicalItem && currentTechnicalItem.isDragged);
        const isItemOver =
            !!(
                isCurrentItemDragged &&
                !this.state.isMouseOverSvg &&
                currentTechnicalItem &&
                currentTechnicalItem.entity.index !== operator.entity.index
            );

        const nextState = {};

        if (isItemOver) {
            nextState.isMouseOverSvg = true;
        }
        if (!this.state.isMouseOver) {
            nextState.isMouseOver = true;
        }

        if (Object.keys(nextState).length > 0) {
            this.setStateIfChanged(nextState, () => {
                if (!isItemOver) {
                    this.scheduleCreatePanel({ isItemOver, isCurrentItemDragged });
                }
            });
        } else if (!isItemOver) {
            this.scheduleCreatePanel({ isItemOver, isCurrentItemDragged });
        }
    };

    onMouseLeaveSvg = (e) => {
        this.clearCreatePanelTimer();

        const relatedTargetId = e?.relatedTarget?.id;
        const shouldKeepPanelOpen =
            relatedTargetId === 'create_panel_right' || relatedTargetId === 'create_panel_bottom';

        if (shouldKeepPanelOpen) {
            if (this.state.isMouseOverSvg) {
                this.setStateIfChanged({
                    isMouseOverSvg: false,
                });
            }
            return;
        }

        this.setStateIfChanged({
            isMouseOverSvg: false,
            isMouseOver: false,
            showCreatePanel: false,
            isMouseOverRightPlaceholder: false,
            isMouseOverBottomPlaceholder: false,
        });
    };

    getDraggingAvailability = (placeType) => {
        const { currentTechnicalItem, connection, operator, isItemDraggable } = this.props;
        const isCurrentItemDragged = !!(currentTechnicalItem && currentTechnicalItem.isDragged);

        if (
            !isItemDraggable ||
            !isCurrentItemDragged ||
            !currentTechnicalItem ||
            currentTechnicalItem.entity.index === operator.entity.index
        ) {
            return null;
        }

        const isOperator = currentTechnicalItem instanceof COperator;
        const connector = connection.getConnectorByType(currentTechnicalItem.connectorType);

        let isAvailableForDragging = connector.areIndexesUnderScope(
            operator.entity,
            currentTechnicalItem.entity,
            placeType,
            currentTechnicalItem.isSelectedAll
        );

        if (isAvailableForDragging && isOperator) {
            if (operator.entity.index.indexOf(currentTechnicalItem.entity.index) === 0) {
                isAvailableForDragging = false;
            }
        }

        return isAvailableForDragging;
    };

    onMouseEnterRightPlaceholder = () => {
        if (this.state.isMouseOverRightPlaceholder) return;

        const isAvailableForDragging = this.getDraggingAvailability(OUTSIDE_ITEM);
        if (isAvailableForDragging === null) return;

        this.setStateIfChanged({
            isMouseOverRightPlaceholder: true,
            isAvailableForDragging,
        });
    };

    onMouseLeaveRightPlaceholder = () => {
        this.setStateIfChanged({
            isMouseOverRightPlaceholder: false,
        });
    };

    onMouseEnterBottomPlaceholder = () => {
        if (this.state.isMouseOverBottomPlaceholder) return;

        const isAvailableForDragging = this.getDraggingAvailability(INSIDE_ITEM);
        if (isAvailableForDragging === null) return;

        this.setStateIfChanged({
            isMouseOverBottomPlaceholder: true,
            isAvailableForDragging,
        });
    };

    onMouseLeaveBottomPlaceholder = () => {
        this.setStateIfChanged({
            isMouseOverBottomPlaceholder: false,
        });
    };

    onMouseDown = (e) => {
        const {
            connection,
            setCurrentItem,
            operator,
            isDisabled,
            isItemDraggable,
            currentTechnicalItem,
            readOnly
        } = this.props;

        if (isDisabled || readOnly) return;
        if (!connection) return;

        if (isItemDraggable) {
            operator.isDragged = true;
            operator.isDraggedForCopy = e.altKey;

            if (this.state.showCreatePanel) {
                this.setStateIfChanged({
                    showCreatePanel: false,
                });
            }
        }

        if (currentTechnicalItem && currentTechnicalItem.index === operator.index) {
            operator.isSelectedAll = currentTechnicalItem.isSelectedAll;
        }

        setCurrentItem(operator);
    };

    onMouseUp = () => {
        const { connection, setCurrentItem, operator, isDisabled, readOnly } = this.props;
        if (isDisabled || readOnly) return;
        if (!connection) return;

        operator.isDragged = false;
        setCurrentItem(operator);
    };

    onClick = () => {
        const { setCurrentItem, operator, isDisabled } = this.props;
        if (isDisabled) return;
        setCurrentItem(operator);
    };

    onDoubleClick = () => {
        this.onClick();
        this.props.formConnectionSvg?.detailsRef?.current?.descriptionRef?.current?.conditionRef?.current?.toggleEdit?.();
    };

    deleteOperator = (e) => {
        const { connection, operator, updateConnection, setCurrentItem } = this.props;
        const connector = connection.getConnectorByType(operator.connectorType);

        this.clearDeleteTimer();

        this.setStateIfChanged({
            showCreatePanel: false,
        });

        this.setJustDeletedItem({
            index: operator.entity.index,
            connectorType: operator.connectorType,
        });

        this.deleteTimer = setTimeout(() => {
            if (this.isUnmounted) return;

            this.setJustDeletedItem(null);

            if (connector) {
                if (connector.getConnectorType() === CONNECTOR_FROM) {
                    connection.removeFromConnectorOperator(operator.entity);
                } else {
                    connection.removeToConnectorOperator(operator.entity);
                }

                updateConnection(connection);

                const currentItem = connector.getCurrentItem();
                if (currentItem) {
                    const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                    setCurrentItem(currentSvgElement);
                }
            }
        }, 450);

        if (e) {
            e.stopPropagation();
        }
    };

    shouldShowRightPlaceholder() {
        const { isMouseOverSvg } = this.state;
        const { connection, currentTechnicalItem, isCurrent, operator } = this.props;

        if (!isMouseOverSvg || isCurrent || !currentTechnicalItem || !currentTechnicalItem.isDragged) {
            return false;
        }

        const connector = connection.getConnectorByType(operator.connectorType);
        const hasNextItem = !!connector.getNextOutsideItem(operator.entity);

        return !hasNextItem && operator.connectorType === currentTechnicalItem.connectorType;
    }

    shouldShowBottomPlaceholder() {
        const { isMouseOverSvg } = this.state;
        const { connection, currentTechnicalItem, isCurrent, operator } = this.props;

        if (!isMouseOverSvg || isCurrent || !currentTechnicalItem || !currentTechnicalItem.isDragged) {
            return false;
        }

        const connector = connection.getConnectorByType(operator.connectorType);
        const hasNextItem = !!connector.getNextInsideItemForOperator(operator.entity);

        return !hasNextItem && operator.connectorType === currentTechnicalItem.connectorType;
    }

    hasLogStroke = () => {
        const { logPanelHeight, currentLogs, operator } = this.props;

        if (logPanelHeight === LogPanelHeight.Low || !currentLogs || currentLogs.length === 0) {
            return false;
        }

        return currentLogs.some(
            (l) => l.index === operator.entity.index && l.connectorType === operator.connectorType
        );
    };

    renderBottomPlaceholder = ({
        operator,
        bottomStroke,
        isDraggableItemOperator,
        isAvailableForDragging,
        isMouseOverBottomPlaceholder,
        isRejectedPlaceholder,
    }) => {
        return (
            <React.Fragment>
                <line
                    x1={operator.width / 2}
                    y1={operator.height}
                    x2={operator.width / 2}
                    y2={operator.height + 20}
                    stroke={bottomStroke}
                    strokeWidth={ARROW_WIDTH}
                />
                {
                    isDraggableItemOperator
                        ? (
                            <polygon
                                id={`arrow_from__${operator.id}__${INSIDE_ITEM}`}
                                data-movable={isAvailableForDragging}
                                onMouseEnter={this.onMouseEnterBottomPlaceholder}
                                onMouseLeave={this.onMouseLeaveBottomPlaceholder}
                                className={
                                    isMouseOverBottomPlaceholder
                                        ? (isRejectedPlaceholder
                                            ? styles.operator_placeholder_over_rejected
                                            : styles.operator_placeholder_over)
                                        : styles.operator_placeholder_leave
                                }
                                stroke={bottomStroke}
                                points={COperator.getPoints(15, 80, 30)}
                            />
                        )
                        : (
                            <rect
                                id={`arrow_from__${operator.id}__${INSIDE_ITEM}`}
                                data-movable={isAvailableForDragging}
                                onMouseEnter={this.onMouseEnterBottomPlaceholder}
                                onMouseLeave={this.onMouseLeaveBottomPlaceholder}
                                className={
                                    isMouseOverBottomPlaceholder
                                        ? (isRejectedPlaceholder
                                            ? styles.operator_placeholder_over_rejected
                                            : styles.operator_placeholder_over)
                                        : styles.operator_placeholder_leave
                                }
                                stroke={bottomStroke}
                                rx={5}
                                ry={5}
                                x={15}
                                y={80}
                                width={30}
                                height={20}
                            />
                        )
                }
                {isMouseOverBottomPlaceholder && isRejectedPlaceholder && (
                    <text
                        dominantBaseline={"middle"}
                        textAnchor={"middle"}
                        fill={bottomStroke}
                        x={30}
                        y={110}
                        className={styles.dependency_text}
                    >
                        {'dependency'}
                    </text>
                )}
            </React.Fragment>
        );
    };

    renderRightPlaceholder = ({
        operator,
        rightStroke,
        isDraggableItemOperator,
        isAvailableForDragging,
        isMouseOverRightPlaceholder,
        isRejectedPlaceholder,
    }) => {
        return (
            <React.Fragment>
                <line
                    x1={operator.width}
                    y1={operator.height / 2}
                    x2={operator.width + 20}
                    y2={operator.height / 2}
                    stroke={rightStroke}
                    strokeWidth={ARROW_WIDTH}
                />
                {
                    isDraggableItemOperator
                        ? (
                            <polygon
                                id={`arrow_from__${operator.id}__${OUTSIDE_ITEM}`}
                                data-movable={isAvailableForDragging}
                                onMouseEnter={this.onMouseEnterRightPlaceholder}
                                onMouseLeave={this.onMouseLeaveRightPlaceholder}
                                className={
                                    isMouseOverRightPlaceholder
                                        ? (isRejectedPlaceholder
                                            ? styles.operator_placeholder_over_rejected
                                            : styles.operator_placeholder_over)
                                        : styles.operator_placeholder_leave
                                }
                                stroke={rightStroke}
                                points={COperator.getPoints(80, 15, 30)}
                            />
                        )
                        : (
                            <rect
                                id={`arrow_from__${operator.id}__${OUTSIDE_ITEM}`}
                                data-movable={isAvailableForDragging}
                                onMouseEnter={this.onMouseEnterRightPlaceholder}
                                onMouseLeave={this.onMouseLeaveRightPlaceholder}
                                className={
                                    isMouseOverRightPlaceholder
                                        ? (isRejectedPlaceholder
                                            ? styles.operator_placeholder_over_rejected
                                            : styles.operator_placeholder_over)
                                        : styles.operator_placeholder_leave
                                }
                                stroke={rightStroke}
                                rx={5}
                                ry={5}
                                x={80}
                                y={20}
                                width={30}
                                height={20}
                            />
                        )
                }
                {isMouseOverRightPlaceholder && isRejectedPlaceholder && (
                    <text
                        dominantBaseline={"middle"}
                        textAnchor={"middle"}
                        fill={rightStroke}
                        className={styles.dependency_text}
                        x={95}
                        y={50}
                    >
                        {'dependency'}
                    </text>
                )}
            </React.Fragment>
        );
    };

    renderDraggablePortal = ({ operator, points, currentTechnicalItem }) => {
        const container = document.getElementById('technical_layout_svg');
        if (!container) return null;

        return ReactDOM.createPortal(
            <svg id={'draggable_operator'} x={operator.x} y={operator.y}>
                <polygon className={styles.draggable_operator} points={points} />
                {currentTechnicalItem.isDraggedForCopy && (
                    <svg xmlns="http://www.w3.org/2000/svg" x={operator.width - 20} width={20} height={20}>
                        <path
                            x={20}
                            stroke={"#00acc2"}
                            d="M4.5 18q-.625 0-1.062-.438Q3 17.125 3 16.5V5h1.5v11.5H14V18Zm3-3q-.625 0-1.062-.438Q6 14.125 6 13.5v-10q0-.625.438-1.062Q6.875 2 7.5 2h8q.625 0 1.062.438Q17 2.875 17 3.5v10q0 .625-.438 1.062Q16.125 15 15.5 15Zm0-1.5h8v-10h-8v10Zm0 0v-10 10Z"
                        />
                    </svg>
                )}
            </svg>,
            container
        );
    };

    renderOperator(operatorType) {
        const {
            polygonStyle,
            isMouseOverSvg,
            isMouseOverBottomPlaceholder,
            isMouseOverRightPlaceholder,
            isAvailableForDragging
        } = this.state;

        const {
            operator,
            isNotDraggable,
            isCurrent,
            currentTechnicalItem,
            isHighlighted,
            readOnly,
            isDisabled,
            logPanelHeight,
            currentLogs,
            isTestingConnection,
            justDeletedItem,
            currentLog,
            currentDirection,
        } = this.props;

        const hasBottomPlaceholder = this.shouldShowBottomPlaceholder();
        const hasRightPlaceholder = this.shouldShowRightPlaceholder();
        const isRejectedPlaceholder = currentTechnicalItem && !isAvailableForDragging;

        const svgExtraSize = 90;
        const svgSize = {
            width: operator.width + (isMouseOverSvg && hasRightPlaceholder ? svgExtraSize : 0),
            height: operator.height + (isMouseOverSvg && hasBottomPlaceholder ? svgExtraSize : 0),
        };

        let bottomStroke = '#5d5b5b';
        if (isMouseOverBottomPlaceholder) {
            bottomStroke = isRejectedPlaceholder ? '#d24545' : '#00acc2';
        }

        let rightStroke = '#5d5b5b';
        if (isMouseOverRightPlaceholder) {
            rightStroke = isRejectedPlaceholder ? '#d24545' : '#00acc2';
        }

        const errorStyles = {};
        if (operator.entity.error.hasError) {
            errorStyles.stroke = '#d24545';
        }

        const textX = '30';
        const textY = '30';
        const closeX = 40;
        const closeY = 0;
        const htmlId = operator.getHtmlIdName();
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;

        const isDisabledStyle = isDisabled ? styles.disabled_operator : '';
        const hasDraggableItem = currentTechnicalItem && currentTechnicalItem.isDragged;
        const hasDraggableOperator = isCurrent && hasDraggableItem;
        const isDraggableItemOperator = hasDraggableItem && currentTechnicalItem instanceof CTechnicalOperator;

        const hasDashAnimation =
            currentDirection &&
            currentLog?.indexPath === operator.entity.index &&
            htmlId.indexOf(currentDirection === 'source' ? 'fromConnector' : 'toConnector') === 0;

        const hasDeleteIcon = isCurrent && !readOnly && !isTestingConnection;

        let logStroke =
            logPanelHeight !== LogPanelHeight.Low &&
            currentLogs.findIndex(
                (l) => l.index === operator.entity.index && l.connectorType === operator.connectorType
            ) !== -1
                ? '#58854d'
                : '';

        if (hasDashAnimation && !!currentLog?.error?.message) {
            logStroke = '#d24545';
            errorStyles.stroke = '#d24545';
        } else if (this.hasLogStroke()) {
            logStroke = '#58854d';
        }

        const isJustCreatedItem = this.isJustCreatedItem();
        const isJustDeletedItem = this.isJustDeletedItem() || (!!justDeletedItem && isHighlighted);

        return (
            <svg
                onMouseEnter={this.onMouseEnterSvg}
                onMouseLeave={this.onMouseLeaveSvg}
                id={htmlId}
                x={operator.x}
                y={operator.y}
                className={`${styles.operator} ${isDisabledStyle} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`}
                width={svgSize.width}
                height={svgSize.height}
            >
                <rect
                    x={0}
                    y={0}
                    width={svgSize.width}
                    height={svgSize.height}
                    fill={'transparent'}
                    id={`${htmlId}_rect`}
                />

                {operatorType === IF_OPERATOR && (
                    <React.Fragment>
                        <DashedElement
                            hasDashAnimation={hasDashAnimation}
                            getElement={(props) => (
                                <polygon
                                    onMouseDown={this.onMouseDown}
                                    onMouseUp={this.onMouseUp}
                                    onClick={this.onClick}
                                    onDoubleClick={this.onDoubleClick}
                                    points={points}
                                    style={{ ...polygonStyle, ...errorStyles }}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                                    id={`${htmlId}_polygon`}
                                    {...props}
                                />
                            )}
                            stroke={logStroke}
                        />
                        <text
                            fontSize={20}
                            dominantBaseline={"middle"}
                            textAnchor={"middle"}
                            className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_label}`}
                            x={textX}
                            y={textY}
                            style={errorStyles}
                        >
                            {'if'}
                        </text>
                        <title>{'if'}</title>
                    </React.Fragment>
                )}

                {operatorType === LOOP_OPERATOR && (
                    <React.Fragment>
                        <DashedElement
                            hasDashAnimation={hasDashAnimation}
                            getElement={(props) => (
                                <polygon
                                    onMouseDown={this.onMouseDown}
                                    onMouseUp={this.onMouseUp}
                                    onClick={this.onClick}
                                    onDoubleClick={this.onDoubleClick}
                                    points={points}
                                    style={{ ...polygonStyle, ...errorStyles }}
                                    className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                                    id={`${htmlId}_polygon`}
                                    {...props}
                                />
                            )}
                            stroke={logStroke}
                        />
                        <svg
                            style={{ pointerEvents: 'none' }}
                            className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`}
                            fill="#000000"
                            width="30px"
                            height="30px"
                            viewBox="0 0 24 24"
                            x="15px"
                            y="14px"
                        >
                            <path
                                style={errorStyles}
                                d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
                            />
                            <path d="M0 0h24v24H0z" fill="none" />
                        </svg>
                        <text
                            style={errorStyles}
                            dominantBaseline={"middle"}
                            textAnchor={"middle"}
                            className={`${isJustDeletedItem ? styles.item_disappear : ''} ${isJustCreatedItem ? styles.item_appear : ''} ${styles.process_label}`}
                            x={'40'}
                            y={'42'}
                        >
                            {operator.entity.iterator}
                        </text>
                        <title>{'loop'}</title>
                    </React.Fragment>
                )}

                {hasDeleteIcon && (
                    <DeleteIcon
                        isJustCreatedItem={isJustCreatedItem}
                        isJustDeletedItem={isJustDeletedItem}
                        svgX={closeX}
                        svgY={closeY}
                        onClick={this.deleteOperator}
                    />
                )}

                {hasBottomPlaceholder
                    ? this.renderBottomPlaceholder({
                        operator,
                        bottomStroke,
                        isDraggableItemOperator,
                        isAvailableForDragging,
                        isMouseOverBottomPlaceholder,
                        isRejectedPlaceholder,
                    })
                    : null}

                {hasRightPlaceholder
                    ? this.renderRightPlaceholder({
                        operator,
                        rightStroke,
                        isDraggableItemOperator,
                        isAvailableForDragging,
                        isMouseOverRightPlaceholder,
                        isRejectedPlaceholder,
                    })
                    : null}

                {hasDraggableOperator &&
                    this.renderDraggablePortal({
                        operator,
                        points,
                        currentTechnicalItem,
                    })}
            </svg>
        );
    }

    render() {
        const { showCreatePanel } = this.state;
        const {
            type,
            setIsCreateElementPanelOpened,
            operator,
            setCoordinatesForCreateElementPanel,
            setCurrentItem
        } = this.props;

        return (
            <React.Fragment>
                {this.renderOperator(type)}
                {showCreatePanel && (
                    <CreatePanel
                        ref={this.createPanelRef}
                        element={operator}
                        onMouseLeave={this.onMouseLeaveSvg}
                        setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                        sourceId={`${operator.getHtmlIdName()}`}
                        setCoordinatesForCreateElementPanel={setCoordinatesForCreateElementPanel}
                        setCurrentItem={setCurrentItem}
                    />
                )}
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