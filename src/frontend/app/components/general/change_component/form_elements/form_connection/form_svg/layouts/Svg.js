/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import PropTypes from 'prop-types';
import {connect} from "react-redux";
import {DETAILS_POSITION, LAYOUT_POSITION} from "../FormConnectionSvg";
import Process from "../elements/Process";
import Arrow from "../elements/Arrow";
import styles from "@themes/default/content/connections/connection_overview_2";
import ConnectorPanels from "@change_component/form_elements/form_connection/form_svg/elements/ConnectorPanels";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {HighlightedMarkers, DefaultMarkers} from "@change_component/form_elements/form_connection/form_svg/elements/Markers";
import Operator from "@change_component/form_elements/form_connection/form_svg/elements/Operator";

function mapStateToProps(state){
    const {currentItem, currentSubItem} = mapItemsToClasses(state);
    return{
        currentItem,
        currentSubItem,
    };
}

@connect(mapStateToProps, {})
class Svg extends React.Component {
    constructor(props) {
        super(props);
        //for dragging
        this.selectedElement = false;
        this.offset = {x: 0, y: 0};
        //for panning
        this.isPointerDown = false;
        this.pointerOrigin = {
            x: 0,
            y: 0
        };
        //for panning and zooming
        this.state = {
            svg: null,
            ratio: 1,
        }
        this.svgRef = React.createRef();
        this.resetRatio = false;
    }


    componentDidMount() {
        const {layoutId, svgId, isScalable, startingSvgY} = this.props;
        const layout = document.getElementById(layoutId);
        const layoutSVG = document.getElementById(svgId);
        if(layout && layoutSVG) {
            let width = layout.offsetWidth;
            let ratio = width / layoutSVG.getBoundingClientRect().width;
            let viewBox = layoutSVG.viewBox.baseVal;
            if(viewBox) {
                viewBox.x = ::this.getViewBoxX();
                viewBox.y = startingSvgY;
                viewBox.width = 1800;
                viewBox.height = 715;
            }
            this.setState({
                svg: layoutSVG,
                ratio,
            });
            window.addEventListener('resize', ::this.setRatio);
        }
        if(isScalable) {
            this.svgRef.current.addEventListener('wheel', ::this.onWheel, {passive: false});
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        let viewBox = this.state.svg.viewBox.baseVal;
        if(viewBox && this.props.detailsPosition !== prevProps.detailsPosition){
            let x = ::this.getViewBoxX();
            if(x !== viewBox.x) {
                viewBox.x = x;
            }
        }
    }

    componentWillUnmount() {
        const {isScalable} = this.props;
        window.removeEventListener('resize', ::this.setRatio);
        if(isScalable) {
            this.svgRef.current.removeEventListener('wheel', ::this.onWheel);
        }
    }

    resizeSVG(){
        const {layoutId} = this.props;
        const layout = document.getElementById(layoutId);
        if(layout) {
            let width = layout.offsetWidth;
            let height = layout.offsetHeight;
            const {svg} = this.state;
            if(svg) {
                const viewBox = svg.viewBox.baseVal;
                if (viewBox) {
                    viewBox.width = width + 300;
                    viewBox.height = height + 300;
                }
            }
        }
    }

    getViewBoxX(){
        const {detailsPosition} = this.props;
        let x = -15;
        if(detailsPosition === DETAILS_POSITION.LEFT) x = -370;
        return x;
    }

    setRatio(e){
        const svgElement = document.getElementById(this.props.svgId);
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
            this.resizeSVG();
        }
    }

    setCurrentItem(currentItem){
        let {items} = this.props;
        const {setCurrentBusinessItem, setCurrentTechnicalItem, setItems, connection, updateConnection} = this.props;
        if(currentItem){
            let index = items.findIndex(item => item.id === currentItem.id);
            if(index !== -1) {
                items.splice(index, 1);
                items.push(currentItem);
            }
        }
        if(setCurrentTechnicalItem){
            setCurrentTechnicalItem(currentItem);
        } else{
            if(setCurrentBusinessItem) {
                setCurrentBusinessItem(currentItem);
            }
        }
        if(setItems) {
            setItems(items);
        }
        const connector = connection.getConnectorByType(currentItem.connectorType);
        connector.setCurrentItem(currentItem.entity);
        updateConnection();
    }

    setItemCoordinates(coordinates){
        const {currentItem, setItems, items} = this.props;
        if(currentItem) {
            if(setItems) {
                setItems(items.map(item => {
                    if (item.id === currentItem.id) {
                        item.setCoordinates(coordinates);
                    }
                    return item;
                }));
            }
        }
    }

    startDrag(e){
        const {isDraggable, setCreateElementPanelPosition} = this.props;
        if(e.target.classList.contains('draggable')) {
            if(isDraggable) {
                this.selectedElement = e.target.parentNode;
                if(this.selectedElement.parentNode){
                    setCreateElementPanelPosition({x: 0, y: 0});
                    this.offset = this.getMousePosition(e, this.selectedElement.parentNode);
                    this.offset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                    this.offset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                }
            } else{
                this.setCoordinatesForCreateElementPanel(e);
            }
        } else{
            setCreateElementPanelPosition({x: 0, y: 0});
            const {svg} = this.state;
            if(svg) {
                this.isPointerDown = true;
                this.pointerOrigin = this.getMousePosition(e, svg);
            }
        }
    }

    drag(e){
        const {isDraggable, dragAndDropStep} = this.props;
        if (this.selectedElement) {
            if(isDraggable) {
                e.preventDefault();
                if(this.selectedElement.parentNode) {
                    const coordinates = this.getMousePosition(e, this.selectedElement.parentNode);
                    let currentOffset = {x: coordinates.x, y: coordinates.y};
                    currentOffset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                    currentOffset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                    let newCoordinates = null;
                    if (Math.abs(currentOffset.x - this.offset.x) >= dragAndDropStep) {
                        newCoordinates = {};
                        newCoordinates.x = Math.round((coordinates.x - this.offset.x) / dragAndDropStep) * dragAndDropStep;
                    }
                    if (Math.abs(currentOffset.y - this.offset.y) >= dragAndDropStep) {
                        if(newCoordinates === null){
                            newCoordinates = {};
                        }
                        newCoordinates.y = Math.round((coordinates.y - this.offset.y) / dragAndDropStep) * dragAndDropStep;
                    }
                    if(newCoordinates !== null) {
                        ::this.setItemCoordinates(newCoordinates)
                    }
                }
            }
        } else{
            if (!this.isPointerDown) {
                return;
            }
            e.preventDefault();
            const {ratio, svg} = this.state;
            let viewBox = svg.viewBox.baseVal;
            if(svg) {
                let pointerPosition = this.getMousePosition(e, svg);
                viewBox.x -= ((pointerPosition.x - this.pointerOrigin.x) * ratio);
                viewBox.y -= ((pointerPosition.y - this.pointerOrigin.y) * ratio);
            }
        }
    }

    endDrag(e){
        if(this.selectedElement){
            this.selectedElement = null;
            this.setCoordinatesForCreateElementPanel(e);
        }
        if(this.isPointerDown) {
            this.isPointerDown = false;
        }
    }

    setCoordinatesForCreateElementPanel(e){
        const {setCreateElementPanelPosition, layoutPosition} = this.props;
        const clientRect = e.target.getBoundingClientRect();
        let x = clientRect.x;
        let y = clientRect.y;
        x += clientRect.width + 8;
        if(e.target.points) {
            y -= clientRect.height * 1.5;
        } else{
            y -= clientRect.height + 5;
        }
        if(layoutPosition === LAYOUT_POSITION.BOTTOM) {
            let layoutSvg;
            if (e.currentTarget.id === 'technical_layout_svg') {
                layoutSvg = document.getElementById('business_layout_svg');
            } else {
                layoutSvg = document.getElementById('technical_layout_svg');
            }
            y -= layoutSvg.height.baseVal.value + 5;
        }
        setCreateElementPanelPosition({x, y});
    }

    getMousePosition(event, element) {
        const CTM = element.getScreenCTM();
        return {
            x: (event.clientX - CTM.e) / CTM.a,
            y: (event.clientY - CTM.f) / CTM.d
        };
    }

    onWheel(e) {
        if(e.altKey === true) {
            const {svg} = this.state;
            let viewBox = svg.viewBox.baseVal;
            let point = svg.createSVGPoint();
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
            let startPoint = point.matrixTransform(svg.getScreenCTM().inverse());
            viewBox.x -= (startPoint.x - viewBox.x) * (scaleDelta - 1);
            viewBox.y -= (startPoint.y - viewBox.y) * (scaleDelta - 1);
            viewBox.width *= scaleDelta;
            viewBox.height *= scaleDelta;
        }
    }

    renderItems(){
        const {currentItem, currentSubItem, items, connection, updateConnection} = this.props;
        return items.map((item,key) => {
            let isHighlighted = currentItem ? item.id.indexOf(currentItem.id) === 0 : false;
            let isCurrent = currentItem ? currentItem.id === item.id : false;
            if(!isCurrent && currentSubItem){
                isCurrent = currentSubItem ? currentSubItem.id === item.id : false;
                isHighlighted = currentSubItem ? item.id.indexOf(currentSubItem.id) === 0 : false;
            }
            switch (item.type){
                case 'if':
                    return(
                        <Operator key={key} type={'if'} operator={item} setCurrentItem={::this.setCurrentItem} isCurrent={isCurrent} isHighlighted={isHighlighted} connection={connection} updateConnection={updateConnection}/>
                    );
                case 'loop':
                    return(
                        <Operator key={key} type={'loop'} operator={item} setCurrentItem={::this.setCurrentItem} isCurrent={isCurrent} isHighlighted={isHighlighted} connection={connection} updateConnection={updateConnection}/>
                    );
                default:
                    return(
                        <Process key={key} process={item} setCurrentItem={::this.setCurrentItem} isCurrent={isCurrent} isHighlighted={isHighlighted} connection={connection} updateConnection={updateConnection}/>
                    );
            }
        });
    }

    renderArrows(){
        const {currentItem, currentSubItem, arrows, items} = this.props;
        return arrows.map((arrow,key) => {
            const from = items.find(item => item.id === arrow.from);
            const to = items.find(item => item.id === arrow.to);
            let isHighlighted = currentItem ? arrow.from.indexOf(currentItem.id) === 0 && arrow.to.indexOf(currentItem.id) === 0 : false;
            if(!isHighlighted && currentSubItem){
                isHighlighted = currentSubItem ? arrow.from.indexOf(currentSubItem.id) === 0 && arrow.to.indexOf(currentSubItem.id) === 0 : false;
            }
            return(
                <Arrow key={key} {...arrow} from={from} to={to} isHighlighted={isHighlighted}/>
            );
        });
    }

    hideCreateElementPanel(){
        this.props.setCreateElementPanelPosition({x: 0, y: 0});
        this.props.setIsCreateElementPanelOpened(false);
    }

    render(){
        const {svgId, fromConnectorPanelParams, toConnectorPanelParams, setIsCreateElementPanelOpened, isCreateElementPanelOpened} = this.props;
        return(
            <React.Fragment>
                <svg
                    id={svgId}
                    className={styles.layout_svg}
                    preserveAspectRatio={'xMidYMid slice'}
                    onMouseDown={::this.startDrag}
                    onMouseMove={::this.drag}
                    onMouseUp={::this.endDrag}
                    onMouseLeave={::this.endDrag}
                    ref={this.svgRef}
                >
                    <defs>
                        <DefaultMarkers/>
                        <HighlightedMarkers/>
                    </defs>
                    {fromConnectorPanelParams && toConnectorPanelParams && <ConnectorPanels fromConnectorPanelParams={fromConnectorPanelParams} toConnectorPanelParams={toConnectorPanelParams}/>}
                    {
                        this.renderArrows()
                    }
                    {
                        this.renderItems()
                    }
                </svg>
                {isCreateElementPanelOpened && <div className={styles.disable_background} onClick={::this.hideCreateElementPanel}/>}
            </React.Fragment>
        );
    }
}

Svg.propTypes = {
    layoutId: PropTypes.string.isRequired,
    svgId: PropTypes.string.isRequired,
    dragAndDropStep: PropTypes.number,
    isDraggable: PropTypes.bool,
    isScalable: PropTypes.bool,
    startingSvgY : PropTypes.number,
};

Svg.defaultProps = {
    dragAndDropStep: 10,
    isDraggable: false,
    isScalable: false,
    startingSvgY: -190,
    fromConnectorPanelParams: null,
    toConnectorPanelParams: null,
}

export default Svg;