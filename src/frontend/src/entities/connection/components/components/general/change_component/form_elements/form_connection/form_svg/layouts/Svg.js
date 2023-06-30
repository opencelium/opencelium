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
import {connect} from "react-redux";
import Process from "../elements/process/Process";
import Arrow from "../elements/Arrow";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import ConnectorPanels from "@change_component/form_elements/form_connection/form_svg/elements/ConnectorPanels";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {
    HighlightedMarkers, DefaultMarkers, DashedMarkers,
    PlaceholderMarkers, RejectedPlaceholderMarkers
} from "@change_component/form_elements/form_connection/form_svg/elements/Markers";
import Operator from "@change_component/form_elements/form_connection/form_svg/elements/Operator";
import CSvg from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import {CONNECTOR_FROM, OUTSIDE_ITEM} from "@classes/content/connection/CConnectorItem";
import CMethodItem from "@classes/content/connection/method/CMethodItem";
import COperatorItem from "@classes/content/connection/operator/COperatorItem";
import {setCurrentTechnicalItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import CFieldBinding from "@classes/content/connection/field_binding/CFieldBinding";
import {Dialog} from "@app_component/base/dialog/Dialog";

function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        currentTechnicalItem,
        isTestingConnection: connectionOverview.isTestingConnection,
    };
}

@connect(mapStateToProps, {setCurrentTechnicalItem})
class Svg extends React.Component {
    constructor(props) {
        super(props);
        //for dragging
        this.selectedElement = null;
        this.offset = {x: 0, y: 0};
        this.dragCoordinates = null;
        //for panning
        this.isPointerDown = false;
        this.pointerOrigin = {
            x: 0,
            y: 0
        };
        //for panning and zooming
        this.state = {
            ratio: 1,
            showDropErrorMessage: false,
        }
        this.svgRef = React.createRef();
        this.resetRatio = false;
    }


    componentDidMount() {
        const {layoutId, svgId, startingSvgX, startingSvgY, detailsPosition} = this.props;
        const layout = document.getElementById(layoutId);
        const layoutSVG = document.getElementById(svgId);

        if(layout && layoutSVG) {
            let width = layout.offsetWidth;
            let ratio = layoutSVG.getBoundingClientRect().width ? width / layoutSVG.getBoundingClientRect().width : 0;
            const viewBox = {x: startingSvgX ? startingSvgX : -15, y: startingSvgY, width: 1800, height: 715};
            CSvg.setViewBox(svgId, viewBox);
            this.setState({
                ratio,
            });
            //window.addEventListener('resize', ::this.setRatio);
        }
        this.svgRef.current.addEventListener('wheel', (a) => this.onWheel(a), {passive: false});
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {svgId, layoutId, detailsPosition, items, startingSvgX, startingSvgY, isDraggable} = this.props;
        const layout = document.getElementById(layoutId);
        const layoutSVG = document.getElementById(svgId);

        if (detailsPosition !== prevProps.detailsPosition || prevProps.startingSvgX !== startingSvgX) {
            const x = startingSvgX ? startingSvgX : -15;
            CSvg.setViewBox(svgId, {x});
        }
        if (prevProps.startingSvgY !== startingSvgY) {
            const y = startingSvgY;
            CSvg.setViewBox(svgId, {y});
        }
        if(items.length === 0 && !isDraggable){
            const viewBox = {x: startingSvgX ? startingSvgX : -15, y: startingSvgY, width: 1800, height: 715};
            CSvg.setViewBox(svgId, viewBox);
        }
        if(this.state.ratio === 0){
            let width = layout.offsetWidth;
            let ratio = layoutSVG.getBoundingClientRect().width ? width / layoutSVG.getBoundingClientRect().width : 0;
            if(ratio !== 0){
                this.setState({ratio});
            }
        }
    }

    componentWillUnmount() {
        const {isScalable} = this.props;
        if(isScalable) {
            this.svgRef.current.removeEventListener('wheel', (a) => this.onWheel(a));
        }
        window.removeEventListener('resize', (a) => this.setRatio(a));
    }

    setRatio(){
        const {layoutId, svgId} = this.props;
        const svgElement = document.getElementById(svgId);
        if(svgElement) {
            let viewBox = svgElement.viewBox.baseVal;
            if (viewBox) {
                let newRatio = viewBox.width / svgElement.getBoundingClientRect().width;
                if (newRatio >= 2) {
                    this.resetRatio = true;
                }
                this.setState({ratio: newRatio}, () => {
                    if (this.resetRatio) {
                        this.resetRatio = false;
                        this.setRatio();
                    }
                });
            }
            CSvg.resizeSVG(layoutId, svgId);
        }
    }

    setItemCoordinates(coordinates){
        const {currentItem, updateItems, items, setCurrentItem} = this.props;
        if(currentItem) {
            if(updateItems) {
                updateItems(items.map(item => {
                    if (item.id === currentItem.id) {
                        item.setCoordinates(coordinates);
                    }
                    return item;
                }));
            }
            currentItem.isDragged = false;
            setCurrentItem(currentItem);
        }
    }

    setCoordinatesForCreateElementPanel(e, type, itemPosition){
        const {setCreateElementPanelPosition, layoutPosition} = this.props;
        if(typeof setCreateElementPanelPosition === 'function'){
            const clientRect = e.target.getBoundingClientRect();
            let x = clientRect.x;
            let y = clientRect.y;
            x += clientRect.width + 8;
            y -= 126;
            setCreateElementPanelPosition({x, y, itemPosition, type});
        }
    }

    startDrag(e){
        const {svgId, isItemDraggable, isItemDraggableByIcon, isDraggable, shouldUnselectOnDraggingPanel, setCurrentItem, connection, updateConnection} = this.props;
        this.dragCoordinates = null;
        if(e.target.classList.contains('draggable')) {
            if(isItemDraggable || isItemDraggableByIcon) {
                this.selectedElement = e.target.parentNode;
                if(this.selectedElement.parentNode){
                    this.hideCreateElementPanel();
                    this.offset = CSvg.getMousePosition(e, this.selectedElement.parentNode);
                    this.offset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                    this.offset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                }
            } else{
                //this.setCoordinatesForCreateElementPanel(e);
            }
        } else{
            if(isDraggable) {
                this.hideCreateElementPanel();
                const svgElement = document.getElementById(svgId);
                if (svgElement) {
                    this.isPointerDown = true;
                    this.pointerOrigin = CSvg.getMousePosition(e, svgElement);
                }
                if(shouldUnselectOnDraggingPanel && e.target.id === svgId){
                    setCurrentItem(null);
                }
            }
        }
    }

    drag(e){
        const {isItemDraggable, isItemDraggableByIcon, dragAndDropStep, svgId, isDraggable, currentItem} = this.props;
        if (this.selectedElement) {
            if(isItemDraggable || isItemDraggableByIcon) {
                e.preventDefault();
                if(this.selectedElement?.parentNode) {
                    const coordinates = CSvg.getMousePosition(e, this.selectedElement.parentNode);
                    let currentOffset = {x: coordinates.x, y: coordinates.y};
                    currentOffset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                    currentOffset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                    this.dragCoordinates = null;
                    if (Math.abs(currentOffset.x - this.offset.x) >= dragAndDropStep) {
                        this.dragCoordinates = {};
                        this.dragCoordinates.x = Math.round((coordinates.x - this.offset.x) / dragAndDropStep) * dragAndDropStep;
                    }
                    if (Math.abs(currentOffset.y - this.offset.y) >= dragAndDropStep) {
                        if(this.dragCoordinates === null){
                            this.dragCoordinates = {};
                        }
                        this.dragCoordinates.y = Math.round((coordinates.y - this.offset.y) / dragAndDropStep) * dragAndDropStep;
                    }
                    if(this.dragCoordinates !== null) {
                        let isOperator = false;
                        let htmlElem = document.getElementById('draggable_process') || null;
                        if(!htmlElem){
                            isOperator = true;
                            htmlElem = document.getElementById('draggable_operator');
                        }
                        if(htmlElem){
                           /* if(isOperator){
                                htmlElem.setAttribute('points', COperator.getPoints(this.dragCoordinates.x || coordinates.x - currentOffset.x, this.dragCoordinates.y || coordinates.y - currentOffset.y));
                            } else{*/
                                if(this.dragCoordinates.x) htmlElem.setAttribute('x', this.dragCoordinates.x);
                                if(this.dragCoordinates.y) htmlElem.setAttribute('y', this.dragCoordinates.y);
                            //}
                        }
                    }
                }
            }
        } else{
            if (!this.isPointerDown || !isDraggable) {
                return;
            }
            e.preventDefault();
            const {ratio} = this.state;
            const svgElement = document.getElementById(svgId)
            if(svgElement) {
                let viewBox = svgElement.viewBox.baseVal;
                let pointerPosition = CSvg.getMousePosition(e, svgElement);
                if(viewBox) {
                    const x = viewBox.x - ((pointerPosition.x - this.pointerOrigin.x) * ratio);
                    const y = viewBox.y - ((pointerPosition.y - this.pointerOrigin.y) * ratio);
                    CSvg.setViewBox(svgId, {x, y});
                }
            }
        }
    }

    endDrag(e){
        const {showDropErrorMessage} = this.state;
        const {connection, currentTechnicalItem, updateConnection} = this.props;
        let shouldMoveItem = false;
        const targetElemId = e.target ? e.target.id : '';
        const sourceElemId = this.selectedElement ? this.selectedElement.id : '';
        if(targetElemId && sourceElemId){
            const targetElemIdSplit = targetElemId.split('__');
            const sourceElemIdSplit = sourceElemId.split('__');
            if(targetElemIdSplit.length > 1 && sourceElemIdSplit.length > 0) {
                const connectorType = sourceElemIdSplit[0];
                const connector = connection.getConnectorByType(connectorType);
                const sourceIndex = sourceElemIdSplit[1].substring(connectorType.length + 1);
                const sourceItem = connector ? connector.getItemByIndex(sourceIndex) : null;
                const targetLeftElemIndexSplit = targetElemIdSplit[1].split('_');
                if(targetLeftElemIndexSplit.length > 0) {
                    const targetLeftIndex = targetElemIdSplit[1].substring(connectorType.length + 1);
                    const targetLeftItem = connector ? connector.getItemByIndex(targetLeftIndex) : null;
                    if (connector && sourceItem && targetLeftItem && sourceIndex !== targetLeftIndex) {
                        let mode = OUTSIDE_ITEM;
                        if(targetElemIdSplit.length === 3){
                            mode = targetElemIdSplit[2];
                        }
                        if(e.target.getAttribute('data-movable') === 'true'){
                            shouldMoveItem = true;
                            this.moveItem(connector, sourceItem, targetLeftItem, mode, !e.altKey, currentTechnicalItem.isSelectedAll);
                        } else{
                            if(!showDropErrorMessage){
                                this.setState({showDropErrorMessage: true});
                            }
                        }
                    }
                }
            }
        }
        if(this.selectedElement){
            this.selectedElement = null;
            //this.setCoordinatesForCreateElementPanel(e);
            if(this.dragCoordinates !== null) {
                if(!shouldMoveItem){
                    this.setItemCoordinates(this.dragCoordinates)
                }
            }
        }
        if(this.isPointerDown) this.isPointerDown = false;
    }

    moveItem(connector, sourceItem, targetLeftItem, mode, shouldDelete = true, isSelectedAll = false){
        const {connection, updateConnection, setCurrentItem} = this.props;
        const nextSiblingItems = connector.getNextSiblings(sourceItem);
        const connectionFieldBinding = [...connection.fieldBinding.map(f=> f.getObject())];
        const result = connection.moveItem(connector, sourceItem, targetLeftItem, mode, shouldDelete);
        let colorMapping = {[sourceItem.color]: result.currentItem.color};
        let targetItem = result.currentItem;
        if(isSelectedAll){
            nextSiblingItems.forEach((item) => {
                const moveItemResult = connection.moveItem(connector, item, targetItem, OUTSIDE_ITEM, shouldDelete);
                targetItem = moveItemResult.currentItem;
                colorMapping = {...colorMapping, ...moveItemResult.colorMapping};
            })
        }
        const allNextItems = connector.getAllNextItems(result.currentItem);
        for (const colorMappingKey in colorMapping) {
            allNextItems.methods.forEach(method => {
                method.request.endpoint = method.request.endpoint.replace(new RegExp(colorMappingKey, 'g'), colorMapping[colorMappingKey]);
                const fieldsString = JSON.stringify(method.request.body.fields);
                method.request.body.fields = JSON.parse(fieldsString.replace(new RegExp(`${colorMappingKey}\\.\\(`, 'g'), `${colorMapping[colorMappingKey]}.(`));
            })
            allNextItems.operators.forEach(o => {
                if(o.condition.leftStatement.color === colorMappingKey){
                    o.condition.leftStatement.setOnlyColor(colorMapping[colorMappingKey]);
                }
                if(o.condition.rightStatement.color === colorMappingKey){
                    o.condition.rightStatement.setOnlyColor(colorMapping[colorMappingKey]);
                }
            })
        }
        const fieldBindings = [...connectionFieldBinding].filter(f => f.from.findIndex(from => !!colorMapping.hasOwnProperty(from.color)) !== -1 || f.to.findIndex(to => !!colorMapping.hasOwnProperty(to.color)) !== -1);
        fieldBindings.forEach(fieldBinding => {
            let localColorMapping = {};
            let newFieldBinding = {...fieldBinding}
            newFieldBinding.from = newFieldBinding.from.map(from => {
                if(colorMapping.hasOwnProperty(from.color)){
                    localColorMapping[from.color] = colorMapping[from.color];
                    from.color = colorMapping[from.color];
                }
                return from;
            })
            newFieldBinding.to = newFieldBinding.to.map(to => {
                if(colorMapping.hasOwnProperty(to.color)){
                    localColorMapping[to.color] = colorMapping[to.color];
                    to.color = colorMapping[to.color];
                }
                return to;
            })
            if(newFieldBinding.enhancement){
                for(let colorMappingKey in localColorMapping){
                    newFieldBinding.enhancement.expertVar = newFieldBinding.enhancement.expertVar.replace(new RegExp(colorMappingKey, 'g'), colorMapping[colorMappingKey]);
                }
            }
            connection.addFieldBinding(CFieldBinding.createFieldBinding(newFieldBinding));
        })
        updateConnection(connection);
        if(result.currentItem){
            connector.setCurrentItem(result.currentItem);
            const currentSvgElement = connector.getSvgElementByIndex(result.currentItem.index);
            setCurrentItem(currentSvgElement)
        }
    }

    onWheel(e) {
        const {svgId, isScalable, items} = this.props;
        if(isScalable && items.length > 0) {
            if (e.shiftKey === true) {
                const svgElement = document.getElementById(svgId);
                if(svgElement) {
                    let point = svgElement.createSVGPoint();
                    let zoom = {
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
                    let scaleDelta = normalized > 0 ? 1 / zoom.scaleFactor : zoom.scaleFactor;
                    point.x = e.clientX;
                    point.y = e.clientY;
                    let startPoint = point.matrixTransform(svgElement.getScreenCTM().inverse());
                    let viewBox = {x: 0, y: 0, width: 0, height: 0};
                    if(svgElement.viewBox.baseVal) {
                        viewBox.x = svgElement.viewBox.baseVal.x - (startPoint.x - viewBox.x) * (scaleDelta - 1);
                        viewBox.y = svgElement.viewBox.baseVal.y - (startPoint.y - viewBox.y) * (scaleDelta - 1);
                        viewBox.width = svgElement.viewBox.baseVal.width * scaleDelta;
                        viewBox.height = svgElement.viewBox.baseVal.height * scaleDelta;
                        CSvg.setViewBox(svgId, viewBox);
                    }
                }
            }
        }
    }

    renderItems(){
        const {
            isItemDraggable, currentTechnicalItem, items, connection, updateConnection, setIsCreateElementPanelOpened,
            readOnly, deleteProcess, setCurrentItem, setSelectAll, isSelectedAll, isTestingConnection, isCreateElementPanelOpened,
        } = this.props;
        return items.map((item,key) => {
            let currentItem = null;
            if(item instanceof CTechnicalProcess || item instanceof CTechnicalOperator){
                currentItem = currentTechnicalItem;
            }
            let isHighlighted = item.isHighlighted(currentItem);
            let isCurrent = item.isCurrent(currentItem);
            switch (item.type){
                case 'if':
                    return(
                        <Operator
                            key={key}
                            isItemDraggable={isItemDraggable && !isTestingConnection}
                            type={'if'}
                            readOnly={readOnly}
                            operator={item}
                            setCurrentItem={setCurrentItem}
                            setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                            isCreateElementPanelOpened={isCreateElementPanelOpened}
                            isCurrent={isCurrent}
                            isHighlighted={isHighlighted}
                            connection={connection}
                            updateConnection={updateConnection}
                            setCoordinatesForCreateElementPanel={(a, b, c) => this.setCoordinatesForCreateElementPanel(a, b ,c)}
                        />
                    );
                case 'loop':
                    return(
                        <Operator
                            key={key}
                            isItemDraggable={isItemDraggable && !isTestingConnection}
                            type={'loop'}
                            readOnly={readOnly}
                            operator={item}
                            setCurrentItem={setCurrentItem}
                            setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                            isCreateElementPanelOpened={isCreateElementPanelOpened}
                            isCurrent={isCurrent}
                            isHighlighted={isHighlighted}
                            connection={connection}
                            updateConnection={updateConnection}
                            setCoordinatesForCreateElementPanel={(a, b, c) => this.setCoordinatesForCreateElementPanel(a, b, c)}
                        />
                    );
                default:
                    return(
                        <Process
                            key={key}
                            isItemDraggable={isItemDraggable && !isTestingConnection}
                            process={item}
                            deleteProcess={deleteProcess}
                            readOnly={readOnly}
                            setCurrentItem={setCurrentItem}
                            setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                            isCreateElementPanelOpened={isCreateElementPanelOpened}
                            isCurrent={isCurrent}
                            isHighlighted={isHighlighted}
                            connection={connection}
                            updateConnection={updateConnection}
                            setCoordinatesForCreateElementPanel={(a, b, c) => this.setCoordinatesForCreateElementPanel(a, b, c)}
                        />
                    );
            }
        });
    }

    renderArrows(){
        const {
            isItemDraggable, currentItem, currentTechnicalItem, arrows, items,
            connection, setCurrentItem,
        } = this.props;
        return arrows.map((arrow,key) => {
            const from = items.find(item => item.id === arrow.from);
            const to = items.find(item => item.id === arrow.to);
            const fromIndex = `${arrow.from}`;
            const toIndex = `${arrow.to}`;
            let isHighlighted = currentItem ? fromIndex.indexOf(currentItem.id) === 0 && toIndex.indexOf(currentItem.id) === 0 : false;
            if(!isHighlighted && currentTechnicalItem){
                isHighlighted = currentTechnicalItem ? fromIndex.indexOf(currentTechnicalItem.id) === 0 && toIndex.indexOf(currentTechnicalItem.id) === 0 : false;
            }
            return(
                <Arrow
                    key={key}
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
    }

    hideCreateElementPanel(){
        const {setCreateElementPanelPosition, setIsCreateElementPanelOpened} = this.props;
        if(typeof setCreateElementPanelPosition === 'function') setCreateElementPanelPosition({x: 0, y: 0});
        if(typeof setIsCreateElementPanelOpened === 'function') setIsCreateElementPanelOpened(false);
    }

    render(){
        const {showDropErrorMessage} = this.state;
        const {
            svgId, fromConnectorPanelParams, toConnectorPanelParams, setIsCreateElementPanelOpened,
            isCreateElementPanelOpened, connection, createElementPanelConnectorType, readOnly,
        } = this.props;
        let svgStyle = this.props.style ? {...this.props.style} : {};
        return(
            <React.Fragment>
                <svg
                    id={svgId}
                    style={svgStyle}
                    className={styles.layout_svg}
                    preserveAspectRatio={'xMidYMid slice'}
                    onMouseDown={(a) => this.startDrag(a)}
                    onMouseMove={(a) => this.drag(a)}
                    onMouseUp={(a) => this.endDrag(a)}
                    onMouseLeave={(a) => this.endDrag(a)}
                    ref={this.svgRef}
                >
                    <defs>
                        <DefaultMarkers/>
                        <HighlightedMarkers/>
                        <DashedMarkers/>
                        <PlaceholderMarkers/>
                        <RejectedPlaceholderMarkers/>
                    </defs>
                    {fromConnectorPanelParams && toConnectorPanelParams &&
                        <ConnectorPanels
                            fromConnectorPanelParams={fromConnectorPanelParams}
                            toConnectorPanelParams={toConnectorPanelParams}
                            connection={connection}
                            setIsCreateElementPanelOpened={setIsCreateElementPanelOpened}
                            createElementPanelConnectorType={createElementPanelConnectorType}
                            readOnly={readOnly}
                        />}
                    {
                        this.renderArrows()
                    }
                    {
                        this.renderItems()
                    }
                </svg>
                <Dialog
                    actions={[{label: 'Close', onClick: () => this.setState({showDropErrorMessage: false}), id: 'show_drop_error_message_close'}]}
                    active={showDropErrorMessage}
                    toggle={() => this.setState({showDropErrorMessage: !showDropErrorMessage})}
                    title={'Dependency Error'}
                >
                    <span>
                        {'You cannot drop here an element, because it has a reference or other elements reference to it.'}
                    </span>
                </Dialog>
                {isCreateElementPanelOpened && <div className={styles.disable_background} onClick={(a) => this.hideCreateElementPanel(a)}/>}
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
    startingSvgY : PropTypes.number,
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
}

export default Svg;
