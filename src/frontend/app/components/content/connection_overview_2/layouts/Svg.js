import React from "react";
import PropTypes from 'prop-types';
import {DETAILS_POSITION} from "@components/content/connection_overview_2/ConnectionLayout";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";
import Process from "@components/content/connection_overview_2/elements/Process";
import Arrow from "@components/content/connection_overview_2/elements/Arrow";
import styles from "@themes/default/content/connections/connection_overview_2";

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
    }

    componentDidMount() {
        const {layoutId, svgId, isScalable} = this.props;
        const layout = document.getElementById(layoutId);
        const layoutSVG = document.getElementById(svgId);
        if(layout && layoutSVG) {
            let width = layout.offsetWidth;
            let ratio = width / layoutSVG.getBoundingClientRect().width;
            let viewBox = layoutSVG.viewBox.baseVal;
            if(viewBox) {
                viewBox.x = ::this.getViewBoxX();
                viewBox.y = -190;
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
        window.addEventListener('resize', ::this.resizeSVG);
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
            const viewBox = svg.viewBox.baseVal;
            if(viewBox) {
                viewBox.width = width + 300;
                viewBox.height = height + 300;
            }
        }
    }

    getViewBoxX(){
        const {detailsPosition} = this.props;
        let x = -15;
        if(detailsPosition === DETAILS_POSITION.LEFT) x = -370;
        return x;
    }

    setRatio(){
        const {svg} = this.state;
        let viewBox = svg.viewBox.baseVal;
        if(viewBox) {
            this.setState({ratio: viewBox.width / svg.getBoundingClientRect().width});
        }
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
        const {isDraggable} = this.props;
        if(e.target.classList.contains('draggable')) {
            if(isDraggable) {
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

    render(){
        const {svgId} = this.props;
        return(
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
                {
                    this.renderMarkers()
                }
                {
                    this.renderArrows()
                }
                {
                    this.renderItems()
                }
            </svg>
        );
    }
}

Svg.propTypes = {
    layoutId: PropTypes.string.isRequired,
    svgId: PropTypes.string.isRequired,
    dragAndDropStep: PropTypes.number,
    isDraggable: PropTypes.bool,
    isScalable: PropTypes.bool,
};

Svg.defaultProps = {
    dragAndDropStep: 10,
    isDraggable: false,
    isScalable: false,
}

export default Svg;