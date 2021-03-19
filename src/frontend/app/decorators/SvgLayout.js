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

import React, { Component } from 'react';


/**
 * to bring the component be draggable, zoomable, pannable
 */
export function SvgLayout(params = {layoutId: '', svgId: '', dragAndDropStep: 10, isDraggable: false}){
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
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0,
                        },
                        svg: null,
                        ratio: 0,
                    }
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
                }

                componentWillUnmount() {
                    window.removeEventListener('resize', ::this.setRatio);
                }

                setRatio(){
                    this.setState({ratio: this.state.viewBox.width / this.state.svg.getBoundingClientRect().width});
                }

                startDrag(e){
                    if(e.target.classList.contains('draggable')) {
                        if(params.isDraggable) {
                            this.selectedElement = e.target.parentNode;
                            this.offset = this.getMousePosition(e, this.selectedElement.parentNode);
                            this.offset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                            this.offset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                        }
                    } else{
                        const {svg} = this.state;
                        this.isPointerDown = true;
                        this.pointerOrigin = this.getMousePosition(e, svg);
                    }
                }

                drag(e, setCoordinates){
                    if (this.selectedElement) {
                        if(params.isDraggable) {
                            e.preventDefault();
                            const coordinates = this.getMousePosition(e, this.selectedElement.parentNode);
                            let currentOffset = {x: coordinates.x, y: coordinates.y};
                            currentOffset.x -= parseFloat(this.selectedElement.getAttributeNS(null, "x"));
                            currentOffset.y -= parseFloat(this.selectedElement.getAttributeNS(null, "y"));
                            let newCoordinates = {};
                            if (Math.abs(currentOffset.x - this.offset.x) >= params.dragAndDropStep) {
                                newCoordinates.x = Math.round((coordinates.x - this.offset.x) / params.dragAndDropStep) * params.dragAndDropStep;
                            }
                            if (Math.abs(currentOffset.y - this.offset.y) >= params.dragAndDropStep) {
                                newCoordinates.y = Math.round((coordinates.y - this.offset.y) / params.dragAndDropStep) * params.dragAndDropStep;
                            }
                            setCoordinates(newCoordinates)
                        }
                    } else{
                        if (!this.isPointerDown) {
                            return;
                        }
                        e.preventDefault();
                        const {ratio, svg} = this.state;
                        let viewBox = svg.viewBox.baseVal;
                        let pointerPosition = this.getMousePosition(e, svg);
                        viewBox.x -= ((pointerPosition.x - this.pointerOrigin.x) * ratio);
                        viewBox.y -= ((pointerPosition.y - this.pointerOrigin.y) * ratio);
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

                render(){
                    const {viewBox} = this.state;
                    return <Component {...this.props} viewBox={viewBox} onWheel={::this.onWheel} startDrag={::this.startDrag} drag={::this.drag} endDrag={::this.endDrag}/>;
                }
            }
        )
    };
}

export default SvgLayout;