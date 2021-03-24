/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import {ARROWS, ITEMS} from "@components/content/connection_overview_2/data";
import {CBusinessOperator} from "@classes/components/content/connection_overview_2/operator/CBusinessOperator";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";
import Process from "@components/content/connection_overview_2/elements/Process";
import Arrow from "@components/content/connection_overview_2/elements/Arrow";
import {setCurrentSubItem} from "@actions/connection_overview_2/set";
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";

/*
* TODO: move items and arrows into redux state and manipulate them instead of component state
*/

/**
 * to bring the component be draggable, scalable, panable
 */
export function SvgLayout(params = {layoutId: '', svgId: '', dragAndDropStep: 10, isDraggable: false, isScalable: false}){
    return function (Component) {
        return(
            class C extends React.Component {
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
                        viewBox: {
                            x: ::this.getViewBoxX(props),
                            y: -190,
                            width: 1800,
                            height: 715,
                        },
                        svg: null,
                        ratio: 0,
                    }
                    this.svgRef = React.createRef();
                }

                componentDidMount() {
                    const layout = document.getElementById(params.layoutId);
                    const layoutSVG = document.getElementById(params.svgId);
                    if(layout && layoutSVG) {
                        const {viewBox} = this.state;
                        let {width, height} = viewBox;
                        if(width === 0 && height === 0){
                            width = layout.offsetWidth;
                            height = layout.offsetHeight;
                        }
                        let ratio = width / layoutSVG.getBoundingClientRect().width;
                        this.setState({
                            viewBox: {...viewBox, width, height},
                            svg: layoutSVG,
                            ratio,
                        });
                        window.addEventListener('resize', ::this.setRatio);
                    }
                    if(params.isScalable) {
                        this.svgRef.current.addEventListener('wheel', ::this.onWheel, {passive: false});
                    }
                }

                componentDidUpdate(prevProps, prevState, snapshot) {
                    if(this.props.detailsPosition !== prevProps.detailsPosition){
                        let x = ::this.getViewBoxX(this.props);
                        if(x !== this.state.viewBox.x) {
                            this.setState({
                                viewBox: {...this.state.viewBox, x},
                            });
                        }
                    }
                }

                componentWillUnmount() {
                    window.removeEventListener('resize', ::this.setRatio);
                    if(params.isScalable) {
                        this.svgRef.current.removeEventListener('wheel', ::this.onWheel);
                    }
                }

                getViewBoxX(props){
                    const {detailsPosition} = props;
                    let x = -15;
                    if(detailsPosition === DETAILS_POSITION.LEFT) x = -370;
                    return x;
                }

                setRatio(){
                    this.setState({ratio: this.state.viewBox.width / this.state.svg.getBoundingClientRect().width});
                }

                setCurrentItem(currentItem){
                    let {items} = this.props;
                    const {setCurrentItem, setCurrentSubItem, setItems} = this.props;
                    if(currentItem){
                        let index = items.findIndex(item => item.id === currentItem.id);
                        if(index !== -1) {
                            items.splice(index, 1);
                            items.push(currentItem);
                        }
                    }
                    if(setCurrentSubItem){
                        setCurrentSubItem(currentItem);
                    } else{
                        if(setCurrentItem) {
                            setCurrentItem(currentItem);
                        }
                    }
                    if(setItems) {
                        setItems(items);
                    }
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
                    if(e.target.classList.contains('draggable')) {
                        if(params.isDraggable) {
                            this.selectedElement = e.target.parentNode;
                            if(this.selectedElement.parentNode){
                                this.offset = this.getMousePosition(e, this.selectedElement.parentNode);
                                this.offset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                                this.offset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                            }
                        }
                    } else{
                        const {svg} = this.state;
                        if(svg) {
                            this.isPointerDown = true;
                            this.pointerOrigin = this.getMousePosition(e, svg);
                        }
                    }
                }

                drag(e){
                    if (this.selectedElement) {
                        if(params.isDraggable) {
                            e.preventDefault();
                            if(this.selectedElement.parentNode) {
                                const coordinates = this.getMousePosition(e, this.selectedElement.parentNode);
                                let currentOffset = {x: coordinates.x, y: coordinates.y};
                                currentOffset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                                currentOffset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                                let newCoordinates = null;
                                if (Math.abs(currentOffset.x - this.offset.x) >= params.dragAndDropStep) {
                                    newCoordinates = {};
                                    newCoordinates.x = Math.round((coordinates.x - this.offset.x) / params.dragAndDropStep) * params.dragAndDropStep;
                                }
                                if (Math.abs(currentOffset.y - this.offset.y) >= params.dragAndDropStep) {
                                    if(newCoordinates === null){
                                        newCoordinates = {};
                                    }
                                    newCoordinates.y = Math.round((coordinates.y - this.offset.y) / params.dragAndDropStep) * params.dragAndDropStep;
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

                endDrag(){
                    if(this.selectedElement){
                        this.selectedElement = null;
                    }
                    if(this.isPointerDown) {
                        this.isPointerDown = false;
                    }
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
                    const {items} = this.props;
                    return items.map((item,key) => {
                        switch (item.type){
                            case 'if':
                                return(
                                    <IfOperator key={key} operator={item} setCurrentItem={::this.setCurrentItem}/>
                                );
                            default:
                                return(
                                    <Process key={key} process={item} setCurrentItem={::this.setCurrentItem}/>
                                );
                        }
                    });
                }

                renderArrows(){
                    const {arrows, items} = this.props;
                    return arrows.map((arrow,key) => {
                        const from = items.find(item => item.id === arrow.from);
                        const to = items.find(item => item.id === arrow.to);
                        return(
                            <Arrow key={key} {...arrow} from={from} to={to}/>
                        );
                    });
                }

                renderMarkers(){
                    return (
                        <defs>
                            <marker id="arrow_head_right" markerWidth="10" markerHeight="7"
                                    refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" />
                            </marker>
                            <marker id="arrow_head_down" markerWidth="7" markerHeight="10"
                                    refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 7 0, 3.5 10" />
                            </marker>
                            <marker id="arrow_head_left" markerWidth="10" markerHeight="7"
                                    refX="0" refY="3.5" orient="auto">
                                <polygon points="10 0, 0 3.5, 10 7" />
                            </marker>
                            <marker id="arrow_head_up" markerWidth="7" markerHeight="10"
                                    refX="0" refY="3.5" orient="auto">
                                <polygon points="0 10, 3.5 0, 7 10" />
                            </marker>
                        </defs>
                    );
                }

                renderBoundaries(){
                    return(
                        <React.Fragment>
                            <rect x={-100000} y={-100000}/>
                            <rect x={100000} y={-100000}/>
                            <rect x={100000} y={100000}/>
                            <rect x={-100000} y={100000}/>
                        </React.Fragment>
                    )
                }

                render(){
                    const {viewBox} = this.state;
                    const {x, y, width, height} = viewBox;
                    return(
                        <svg
                            id={params.svgId}
                            className={styles.layout_svg}
                            viewBox={`${x} ${y} ${width} ${height}`}
                            preserveAspectRatio={'xMidYMid slice'}
                            onMouseDown={::this.startDrag}
                            onMouseMove={::this.drag}
                            onMouseUp={::this.endDrag}
                            onMouseLeave={::this.endDrag}
                            ref={this.svgRef}
                        >
                            {
                                this.renderMarkers()
                            }
                            {
                                this.renderArrows()
                            }
                            {
                                this.renderItems()
                            }
                            {
                                this.renderBoundaries()
                            }
                        </svg>
                    );
                }
            }
        )
    };
}

export default SvgLayout;