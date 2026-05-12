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

import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Process from "../elements/process/Process";
import Arrow from "../elements/Arrow";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import ConnectorPanels from "@change_component/form_elements/form_connection/form_svg/elements/ConnectorPanels";
import { mapItemsToClasses } from "@change_component/form_elements/form_connection/form_svg/utils";
import {
    HighlightedMarkers,
    DefaultMarkers,
    DashedMarkers,
    PlaceholderMarkers,
    RejectedPlaceholderMarkers
} from "@change_component/form_elements/form_connection/form_svg/elements/Markers";
import Operator from "@change_component/form_elements/form_connection/form_svg/elements/Operator";
import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";
import { CTechnicalProcess } from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import { CTechnicalOperator } from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import { CONNECTOR_FROM, OUTSIDE_ITEM } from "@classes/content/connection/CConnectorItem";
import CFieldBinding from "@classes/content/connection/field_binding/CFieldBinding";
import { Dialog } from "@app_component/base/dialog/Dialog";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import GetModalProp from "@entity/connection/components/decorators/GetModalProp";

function mapStateToProps(state, props) {
    const { currentTechnicalItem, connectionOverview } = mapItemsToClasses(state, props.isModal);
    const {isFullScreen} = state.applicationReducer;;

    return {
        currentTechnicalItem,
        isTestingConnection: connectionOverview.isTestingConnection,
        isFullScreen,
    };
}

@GetModalProp()
@connect(mapStateToProps, {}, null, { forwardRef: true })
class Svg extends React.Component {
    constructor(props) {
        super(props);

        // dragging
        this.selectedElement = null;
        this.offset = { x: 0, y: 0 };
        this.dragCoordinates = null;

        // panning
        this.isPointerDown = false;
        this.pointerOrigin = { x: 0, y: 0 };

        this.state = {
            ratio: 1,
            showDropErrorMessage: false,
        };

        this.svgRef = React.createRef();
        this.resetRatio = false;
        this.processRef = React.createRef();
        this.operatorRef = React.createRef();
        this.fromConnectorPanelRef = React.createRef();
        this.toConnectorPanelRef = React.createRef();

        this.itemMapCache = {
            itemsRef: null,
            map: new Map(),
        };

        this.renderItemsCache = {
            deps: null,
            result: null,
        };

        this.renderArrowsCache = {
            deps: null,
            result: null,
        };

        this.handleWheel = this.onWheel.bind(this);
        this.handleResize = this.setRatio.bind(this);
        this.handleMouseDown = this.startDrag.bind(this);
        this.handleMouseMove = this.drag.bind(this);
        this.handleMouseUp = this.endDrag.bind(this);
        this.handleMouseLeave = this.endDrag.bind(this);
        this.handleZoomIn = this.zoomIn.bind(this);
        this.handleZoomOut = this.zoomOut.bind(this);
        this.handleHideCreatePanel = this.hideCreateElementPanel.bind(this);
        this.handleCloseDropError = this.closeDropError.bind(this);
        this.handleToggleDropError = this.toggleDropError.bind(this);
        this.handleSetCoordinatesForCreateElementPanel = this.setCoordinatesForCreateElementPanel.bind(this);
    }

    componentDidMount() {
        const { layoutId, svgId, startingSvgX, startingSvgY } = this.props;
        const layout = document.getElementById(layoutId);
        const layoutSVG = document.getElementById(svgId);

        if (layout && layoutSVG) {
            const width = layout.offsetWidth;
            const rectWidth = layoutSVG.getBoundingClientRect().width;
            const ratio = rectWidth ? width / rectWidth : 0;
            const viewBox = {
                x: startingSvgX ? startingSvgX : -15,
                y: startingSvgY,
                width: 2600,
                height: 1000,
            };

            CSvg.setViewBox(svgId, viewBox);
            this.setState({ ratio });
        }

        if (this.svgRef.current) {
            this.svgRef.current.addEventListener('wheel', this.handleWheel, { passive: false });
        }

        window.addEventListener('resize', this.handleResize);
    }

    componentDidUpdate(prevProps) {
        const { svgId, layoutId, detailsPosition, items, startingSvgX, startingSvgY, isDraggable } = this.props;
        const layout = document.getElementById(layoutId);
        const layoutSVG = document.getElementById(svgId);

        if (detailsPosition !== prevProps.detailsPosition || prevProps.startingSvgX !== startingSvgX) {
            const x = startingSvgX ? startingSvgX : -15;
            CSvg.setViewBox(svgId, { x });
        }

        if (prevProps.startingSvgY !== startingSvgY) {
            CSvg.setViewBox(svgId, { y: startingSvgY });
        }

        if (items.length === 0 && !isDraggable) {
            const viewBox = {
                x: startingSvgX ? startingSvgX : -15,
                y: startingSvgY,
                width: 1800,
                height: 715,
            };
            CSvg.setViewBox(svgId, viewBox);
        }

        if (this.state.ratio === 0 && layout && layoutSVG) {
            const width = layout.offsetWidth;
            const rectWidth = layoutSVG.getBoundingClientRect().width;
            const ratio = rectWidth ? width / rectWidth : 0;
            if (ratio !== 0) {
                this.setState({ ratio });
            }
        }
    }

    componentWillUnmount() {
        if (this.svgRef.current) {
            this.svgRef.current.removeEventListener('wheel', this.handleWheel);
        }
        window.removeEventListener('resize', this.handleResize);
    }

    setStateIfChanged = (nextState, callback) => {
        const hasChanges = Object.keys(nextState).some((key) => this.state[key] !== nextState[key]);
        if (hasChanges) {
            this.setState(nextState, callback);
        } else if (callback) {
            callback();
        }
    };

    closeDropError() {
        this.setStateIfChanged({ showDropErrorMessage: false });
    }

    toggleDropError() {
        this.setState(({ showDropErrorMessage }) => ({
            showDropErrorMessage: !showDropErrorMessage,
        }));
    }

    getItemMap(items) {
        if (this.itemMapCache.itemsRef === items) {
            return this.itemMapCache.map;
        }

        const map = new Map();
        for (let i = 0; i < items.length; i++) {
            map.set(items[i].id, items[i]);
        }

        this.itemMapCache = {
            itemsRef: items,
            map,
        };

        return map;
    }

    setRatio() {
        const { layoutId, svgId } = this.props;
        const svgElement = document.getElementById(svgId);

        if (!svgElement) return;

        const viewBox = svgElement.viewBox.baseVal;
        if (viewBox) {
            const rectWidth = svgElement.getBoundingClientRect().width;
            const newRatio = rectWidth ? viewBox.width / rectWidth : 0;

            if (newRatio >= 2) {
                this.resetRatio = true;
            }

            this.setStateIfChanged({ ratio: newRatio }, () => {
                if (this.resetRatio) {
                    this.resetRatio = false;
                    this.setRatio();
                }
            });
        }

        CSvg.resizeSVG(layoutId, svgId);
    }

    setItemCoordinates(coordinates) {
        const { currentItem, updateItems, items, setCurrentItem } = this.props;

        if (!currentItem) return;

        if (updateItems) {
            updateItems(
                items.map((item) => {
                    if (item.id === currentItem.id) {
                        item.setCoordinates(coordinates);
                    }
                    return item;
                })
            );
        }

        currentItem.isDragged = false;
        setCurrentItem(currentItem);
    }

    setCoordinatesForCreateElementPanel(e, type, itemPosition) {
        const { setCreateElementPanelPosition } = this.props;

        if (typeof setCreateElementPanelPosition !== 'function') return;

        const clientRect = e instanceof SVGGElement ? e.getBoundingClientRect() : e.target.getBoundingClientRect();

        let x = clientRect.x;
        let y = clientRect.y;

        x += clientRect.width + 8;
        y -= 126;

        setCreateElementPanelPosition({ x, y, itemPosition, type });
    }

    startDrag(e) {
        const {
            svgId,
            isItemDraggable,
            isItemDraggableByIcon,
            isDraggable,
            shouldUnselectOnDraggingPanel,
            setCurrentItem,
        } = this.props;

        this.dragCoordinates = null;

        if (e.target.classList.contains('draggable')) {
            if (isItemDraggable || isItemDraggableByIcon) {
                this.selectedElement = e.target.parentNode;

                if (this.selectedElement?.parentNode) {
                    this.hideCreateElementPanel();

                    this.offset = CSvg.getMousePosition(e, this.selectedElement.parentNode);
                    this.offset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                    this.offset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                }
            }
        } else if (isDraggable) {
            this.hideCreateElementPanel();

            const svgElement = document.getElementById(svgId);
            if (svgElement) {
                this.isPointerDown = true;
                this.pointerOrigin = CSvg.getMousePosition(e, svgElement);
            }

            if (shouldUnselectOnDraggingPanel && e.target.id === svgId) {
                setCurrentItem(null);
            }
        }
    }

    drag(e) {
        const {
            isItemDraggable,
            isItemDraggableByIcon,
            dragAndDropStep,
            svgId,
            isDraggable,
        } = this.props;

        if (this.selectedElement) {
            if (!(isItemDraggable || isItemDraggableByIcon)) return;

            e.preventDefault();

            if (!this.selectedElement?.parentNode) return;

            const coordinates = CSvg.getMousePosition(e, this.selectedElement.parentNode);
            const currentOffset = {
                x: coordinates.x - parseFloat(this.selectedElement.getAttributeNS(null, "x")),
                y: coordinates.y - parseFloat(this.selectedElement.getAttributeNS(null, "y")),
            };

            this.dragCoordinates = null;

            if (Math.abs(currentOffset.x - this.offset.x) >= dragAndDropStep) {
                this.dragCoordinates = this.dragCoordinates || {};
                this.dragCoordinates.x = Math.round((coordinates.x - this.offset.x) / dragAndDropStep) * dragAndDropStep;
            }

            if (Math.abs(currentOffset.y - this.offset.y) >= dragAndDropStep) {
                this.dragCoordinates = this.dragCoordinates || {};
                this.dragCoordinates.y = Math.round((coordinates.y - this.offset.y) / dragAndDropStep) * dragAndDropStep;
            }

            if (this.dragCoordinates !== null) {
                let htmlElem = document.getElementById('draggable_process') || document.getElementById('draggable_operator');

                if (htmlElem) {
                    if (this.dragCoordinates.x !== undefined) {
                        htmlElem.setAttribute('x', this.dragCoordinates.x);
                    }
                    if (this.dragCoordinates.y !== undefined) {
                        htmlElem.setAttribute('y', this.dragCoordinates.y);
                    }
                }
            }

            return;
        }

        if (!this.isPointerDown || !isDraggable) return;

        e.preventDefault();

        const { ratio } = this.state;
        const svgElement = document.getElementById(svgId);

        if (!svgElement) return;

        const viewBox = svgElement.viewBox.baseVal;
        const pointerPosition = CSvg.getMousePosition(e, svgElement);

        if (viewBox) {
            const x = viewBox.x - ((pointerPosition.x - this.pointerOrigin.x) * ratio);
            const y = viewBox.y - ((pointerPosition.y - this.pointerOrigin.y) * ratio);
            CSvg.setViewBox(svgId, { x, y });
        }
    }

    endDrag(e) {
        const { showDropErrorMessage } = this.state;
        const { connection, currentTechnicalItem } = this.props;

        let shouldMoveItem = false;
        const targetElemId = e.target ? e.target.id : '';
        const sourceElemId = this.selectedElement ? this.selectedElement.id : '';

        if (targetElemId && sourceElemId) {
            const targetElemIdSplit = targetElemId.split('__');
            const sourceElemIdSplit = sourceElemId.split('__');

            if (targetElemIdSplit.length > 1 && sourceElemIdSplit.length > 0) {
                const connectorType = sourceElemIdSplit[0];
                const connector = connection.getConnectorByType(connectorType);
                const sourceIndex = sourceElemIdSplit[1].substring(connectorType.length + 1);
                const sourceItem = connector ? connector.getItemByIndex(sourceIndex) : null;
                const targetLeftElemIndexSplit = targetElemIdSplit[1].split('_');

                if (targetLeftElemIndexSplit.length > 0) {
                    const targetLeftIndex = targetElemIdSplit[1].substring(connectorType.length + 1);
                    const targetLeftItem = connector ? connector.getItemByIndex(targetLeftIndex) : null;

                    if (connector && sourceItem && targetLeftItem && sourceIndex !== targetLeftIndex) {
                        let mode = OUTSIDE_ITEM;
                        if (targetElemIdSplit.length === 3) {
                            mode = targetElemIdSplit[2];
                        }

                        if (e.target.getAttribute('data-movable') === 'true') {
                            shouldMoveItem = true;
                            this.moveItem(
                                connector,
                                sourceItem,
                                targetLeftItem,
                                mode,
                                !e.altKey,
                                currentTechnicalItem.isSelectedAll
                            );
                        } else if (!showDropErrorMessage) {
                            this.setStateIfChanged({ showDropErrorMessage: true });
                        }
                    }
                }
            }
        }

        if (this.selectedElement) {
            this.selectedElement = null;

            if (this.dragCoordinates !== null && !shouldMoveItem) {
                this.setItemCoordinates(this.dragCoordinates);
            }
        }

        if (this.isPointerDown) {
            this.isPointerDown = false;
        }
    }

    moveItem(connector, sourceItem, targetLeftItem, mode, shouldDelete = true, isSelectedAll = false) {
        const { connection, updateConnection, setCurrentItem } = this.props;

        const nextSiblingItems = connector.getNextSiblings(sourceItem);
        const connectionFieldBinding = [...connection.fieldBinding.map((f) => f.getObject())];
        const result = connection.moveItem(connector, sourceItem, targetLeftItem, mode, shouldDelete);

        let colorMapping = { [sourceItem.color]: result.currentItem.color };
        let targetItem = result.currentItem;

        if (isSelectedAll) {
            nextSiblingItems.forEach((item) => {
                const moveItemResult = connection.moveItem(connector, item, targetItem, OUTSIDE_ITEM, shouldDelete);
                targetItem = moveItemResult.currentItem;
                colorMapping = { ...colorMapping, ...moveItemResult.colorMapping };
            });
        }

        const allNextItems = connector.getAllNextItems(result.currentItem);

        for (const colorMappingKey in colorMapping) {
            allNextItems.methods.forEach((method) => {
                method.request.endpoint = method.request.endpoint.replace(
                    new RegExp(colorMappingKey, 'g'),
                    colorMapping[colorMappingKey]
                );

                const fieldsString = JSON.stringify(method.request.body.fields);
                method.request.body.fields = JSON.parse(
                    fieldsString.replace(
                        new RegExp(`${colorMappingKey}\\.\\(`, 'g'),
                        `${colorMapping[colorMappingKey]}.(`
                    )
                );
            });

            allNextItems.operators.forEach((o) => {
                if (o.condition.leftStatement.color === colorMappingKey) {
                    o.condition.leftStatement.setOnlyColor(colorMapping[colorMappingKey]);
                }
                if (o.condition.rightStatement.color === colorMappingKey) {
                    o.condition.rightStatement.setOnlyColor(colorMapping[colorMappingKey]);
                }
            });
        }

        const fieldBindings = [...connectionFieldBinding].filter(
            (f) =>
                f.from.findIndex((from) => Object.prototype.hasOwnProperty.call(colorMapping, from.color)) !== -1 ||
                f.to.findIndex((to) => Object.prototype.hasOwnProperty.call(colorMapping, to.color)) !== -1
        );

        fieldBindings.forEach((fieldBinding) => {
            const localColorMapping = {};
            const newFieldBinding = { ...fieldBinding };

            newFieldBinding.from = newFieldBinding.from.map((from) => {
                if (Object.prototype.hasOwnProperty.call(colorMapping, from.color)) {
                    localColorMapping[from.color] = colorMapping[from.color];
                    from.color = colorMapping[from.color];
                }
                return from;
            });

            newFieldBinding.to = newFieldBinding.to.map((to) => {
                if (Object.prototype.hasOwnProperty.call(colorMapping, to.color)) {
                    localColorMapping[to.color] = colorMapping[to.color];
                    to.color = colorMapping[to.color];
                }
                return to;
            });

            if (newFieldBinding.enhancement) {
                for (const colorMappingKey in localColorMapping) {
                    newFieldBinding.enhancement.expertVar = newFieldBinding.enhancement.expertVar.replace(
                        new RegExp(colorMappingKey, 'g'),
                        colorMapping[colorMappingKey]
                    );
                }
            }

            connection.addFieldBinding(CFieldBinding.createFieldBinding(newFieldBinding));
        });

        connection.removeDuplicatesFromFieldBinding();
        updateConnection(connection);

        if (result.currentItem) {
            connector.setCurrentItem(result.currentItem);
            const currentSvgElement = connector.getSvgElementByIndex(result.currentItem.index);
            setCurrentItem(currentSvgElement);
        }
    }

    onWheel(e) {
        const { svgId, isScalable, items } = this.props;

        if (!(isScalable && items.length > 0)) return;
        if (e.shiftKey !== true) return;

        const svgElement = document.getElementById(svgId);
        if (!svgElement) return;

        const point = svgElement.createSVGPoint();
        const zoom = {
            scaleFactor: 1.2,
            duration: 0.5,
        };

        e.preventDefault();

        let normalized;
        let delta = e.wheelDelta;

        if (delta) {
            normalized = (delta % 120) === 0 ? delta / 120 : delta / 12;
        } else {
            delta = e.deltaY || e.detail || 0;
            normalized = -(delta % 3 ? delta * 10 : delta / 3);
        }

        const scaleDelta = normalized > 0 ? 1 / zoom.scaleFactor : zoom.scaleFactor;

        point.x = e.clientX;
        point.y = e.clientY;

        const startPoint = point.matrixTransform(svgElement.getScreenCTM().inverse());
        const viewBox = { x: 0, y: 0, width: 0, height: 0 };

        if (svgElement.viewBox.baseVal) {
            viewBox.x = svgElement.viewBox.baseVal.x - (startPoint.x - viewBox.x) * (scaleDelta - 1);
            viewBox.y = svgElement.viewBox.baseVal.y - (startPoint.y - viewBox.y) * (scaleDelta - 1);
            viewBox.width = svgElement.viewBox.baseVal.width * scaleDelta;
            viewBox.height = svgElement.viewBox.baseVal.height * scaleDelta;
            CSvg.setViewBox(svgId, viewBox);
        }
    }

    zoomIn() {
        this.onWheel({
            shiftKey: true,
            wheelDelta: 300,
            deltaY: -250,
            detail: 0,
            clientX: 0,
            clientY: 0,
            preventDefault: () => {},
        });
    }

    zoomOut() {
        this.onWheel({
            shiftKey: true,
            wheelDelta: -300,
            deltaY: 250,
            detail: 0,
            clientX: 0,
            clientY: 0,
            preventDefault: () => {},
        });
    }

    getRenderItemsDeps() {
        const {
            isItemDraggable,
            currentTechnicalItem,
            items,
            connection,
            updateConnection,
            setIsCreateElementPanelOpened,
            readOnly,
            deleteProcess,
            setCurrentItem,
            isTestingConnection,
            isCreateElementPanelOpened,
            formConnectionSvg,
        } = this.props;

        return [
            items,
            currentTechnicalItem,
            isItemDraggable,
            connection,
            updateConnection,
            setIsCreateElementPanelOpened,
            readOnly,
            deleteProcess,
            setCurrentItem,
            isTestingConnection,
            isCreateElementPanelOpened,
            formConnectionSvg,
        ];
    }

    renderItems() {
        const deps = this.getRenderItemsDeps();

        if (
            this.renderItemsCache.deps &&
            this.renderItemsCache.deps.length === deps.length &&
            this.renderItemsCache.deps.every((dep, index) => dep === deps[index])
        ) {
            return this.renderItemsCache.result;
        }

        const {
            isItemDraggable,
            currentTechnicalItem,
            items,
            connection,
            updateConnection,
            setIsCreateElementPanelOpened,
            readOnly,
            deleteProcess,
            setCurrentItem,
            isTestingConnection,
            isCreateElementPanelOpened,
            formConnectionSvg,
        } = this.props;

        const result = items.map((item) => {
            let currentItem = null;

            if (item instanceof CTechnicalProcess || item instanceof CTechnicalOperator) {
                currentItem = currentTechnicalItem;
            }

            const isHighlighted = item.isHighlighted(currentItem);
            const isCurrent = item.isCurrent(currentItem);
            const sharedProps = {
                isItemDraggable: isItemDraggable && !isTestingConnection,
                readOnly,
                setCurrentItem,
                setIsCreateElementPanelOpened,
                isCreateElementPanelOpened,
                isCurrent,
                isHighlighted,
                connection,
                updateConnection,
                setCoordinatesForCreateElementPanel: this.handleSetCoordinatesForCreateElementPanel,
            };

            switch (item.type) {
                case 'if':
                    return (
                        <Operator
                            ref={this.operatorRef}
                            formConnectionSvg={formConnectionSvg}
                            key={item.id}
                            type={'if'}
                            operator={item}
                            {...sharedProps}
                        />
                    );

                case 'loop':
                    return (
                        <Operator
                            ref={this.operatorRef}
                            formConnectionSvg={formConnectionSvg}
                            key={item.id}
                            type={'loop'}
                            operator={item}
                            {...sharedProps}
                        />
                    );

                default:
                    return (
                        <Process
                            ref={this.processRef}
                            key={item.id}
                            process={item}
                            deleteProcess={deleteProcess}
                            {...sharedProps}
                        />
                    );
            }
        });

        this.renderItemsCache = {
            deps,
            result,
        };

        return result;
    }

    getRenderArrowsDeps() {
        const {
            isItemDraggable,
            currentItem,
            currentTechnicalItem,
            arrows,
            items,
            connection,
            setCurrentItem,
        } = this.props;

        return [
            arrows,
            items,
            currentItem,
            currentTechnicalItem,
            isItemDraggable,
            connection,
            setCurrentItem,
        ];
    }

    renderArrows() {
        const deps = this.getRenderArrowsDeps();

        if (
            this.renderArrowsCache.deps &&
            this.renderArrowsCache.deps.length === deps.length &&
            this.renderArrowsCache.deps.every((dep, index) => dep === deps[index])
        ) {
            return this.renderArrowsCache.result;
        }

        const {
            isItemDraggable,
            currentItem,
            currentTechnicalItem,
            arrows,
            items,
            connection,
            setCurrentItem,
        } = this.props;

        const itemMap = this.getItemMap(items);

        const result = arrows.map((arrow, index) => {
            const from = itemMap.get(arrow.from);
            const to = itemMap.get(arrow.to);
            const fromIndex = `${arrow.from}`;
            const toIndex = `${arrow.to}`;

            let isHighlighted = currentItem
                ? fromIndex.indexOf(currentItem.id) === 0 && toIndex.indexOf(currentItem.id) === 0
                : false;

            if (!isHighlighted && currentTechnicalItem) {
                isHighlighted =
                    fromIndex.indexOf(currentTechnicalItem.id) === 0 &&
                    toIndex.indexOf(currentTechnicalItem.id) === 0;
            }

            return (
                <Arrow
                    key={arrow.id || `${arrow.from}_${arrow.to}_${index}`}
                    isItemDraggable={isItemDraggable}
                    connection={connection}
                    {...arrow}
                    setCurrentItem={setCurrentItem}
                    from={from}
                    to={to}
                    isHighlighted={isHighlighted}
                />
            );
        });

        this.renderArrowsCache = {
            deps,
            result,
        };

        return result;
    }

    hideCreateElementPanel() {
        const { setCreateElementPanelPosition, setIsCreateElementPanelOpened } = this.props;

        if (typeof setCreateElementPanelPosition === 'function') {
            setCreateElementPanelPosition({ x: 0, y: 0 });
        }

        if (typeof setIsCreateElementPanelOpened === 'function') {
            setIsCreateElementPanelOpened(false);
        }
    }

    render() {
        const { showDropErrorMessage } = this.state;
        const {
            svgId,
            fromConnectorPanelParams,
            toConnectorPanelParams,
            setIsCreateElementPanelOpened,
            isCreateElementPanelOpened,
            connection,
            createElementPanelConnectorType,
            readOnly,
            isFullScreen,
        } = this.props;

        const svgStyle = this.props.style ? { ...this.props.style } : {};

        return (
            <React.Fragment>
                <div
                    style={{
                        position: "absolute",
                        top: '30px',
                        left: isFullScreen ? '16px' : '64px',
                        display: 'grid',
                        background: '#fff',
                        padding: '5px',
                        borderRadius: '3px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                        transition: '.5s'
                    }}
                >
                    <TooltipFontIcon
                        wrapStyles={{ borderBottom: '1px solid #eee', lineHeight: 0, paddingBottom: '5px' }}
                        size={20}
                        onClick={this.handleZoomIn}
                        tooltip={<span>Zoom in<br />(Shift + Forward Scroll)</span>}
                        value={'add'}
                        tooltipPosition={'right'}
                        isButton={true}
                    />
                    <TooltipFontIcon
                        wrapStyles={{ lineHeight: 0, paddingTop: '5px' }}
                        size={20}
                        onClick={this.handleZoomOut}
                        tooltip={<span>Zoom out<br />(Shift + Backward Scroll)</span>}
                        value={'remove'}
                        tooltipPosition={'right'}
                        isButton={true}
                    />
                </div>

                <svg
                    id={svgId}
                    style={svgStyle}
                    className={styles.layout_svg}
                    preserveAspectRatio={'xMidYMid slice'}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                    onMouseLeave={this.handleMouseLeave}
                    ref={this.svgRef}
                >
                    <defs>
                        <DefaultMarkers />
                        <HighlightedMarkers />
                        <DashedMarkers />
                        <PlaceholderMarkers />
                        <RejectedPlaceholderMarkers />
                    </defs>

                    {fromConnectorPanelParams && toConnectorPanelParams && (
                        <ConnectorPanels
                            ref={{ fromConnector: this.fromConnectorPanelRef, toConnector: this.toConnectorPanelRef }}
                            fromConnectorPanelParams={fromConnectorPanelParams}
                            toConnectorPanelParams={toConnectorPanelParams}
                            connection={connection}
                            setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                            createElementPanelConnectorType={createElementPanelConnectorType}
                            readOnly={readOnly}
                        />
                    )}

                    {this.renderArrows()}
                    {this.renderItems()}
                </svg>

                <Dialog
                    actions={[
                        {
                            label: 'Close',
                            onClick: this.handleCloseDropError,
                            id: 'show_drop_error_message_close',
                        }
                    ]}
                    active={showDropErrorMessage}
                    toggle={this.handleToggleDropError}
                    title={'Dependency Error'}
                >
                    <span>
                        {'You cannot drop here an element, because it has a reference or other elements reference to it.'}
                    </span>
                </Dialog>

                {isCreateElementPanelOpened && (
                    <div
                        className={styles.disable_background}
                        onClick={this.handleHideCreatePanel}
                    />
                )}
            </React.Fragment>
        );
    }
}

Svg.propTypes = {
    layoutId: PropTypes.string.isRequired,
    svgId: PropTypes.string.isRequired,
    deleteProcess: PropTypes.func.isRequired,
    dragAndDropStep: PropTypes.number,
    isItemDraggable: PropTypes.bool,
    isItemDraggableByIcon: PropTypes.bool,
    isDraggable: PropTypes.bool,
    isScalable: PropTypes.bool,
    startingSvgY: PropTypes.number,
};

Svg.defaultProps = {
    dragAndDropStep: 10,
    isItemDraggable: false,
    isItemDraggableByIcon: false,
    isDraggable: true,
    isScalable: false,
    startingSvgY: -190,
    fromConnectorPanelParams: null,
    toConnectorPanelParams: null,
    shouldUnselectOnDraggingPanel: false,
    style: null,
};

export default Svg;
