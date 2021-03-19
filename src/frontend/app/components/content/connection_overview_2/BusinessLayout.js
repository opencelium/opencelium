import React from 'react';
import {connect} from 'react-redux';
import Process, {
    PROCESS_HEIGHT,
    PROCESS_LABEL_PADDING
} from "@components/content/connection_overview_2/elements/Process";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";
import SvgLayout from "@decorators/SvgLayout";
import Arrow from "@components/content/connection_overview_2/elements/Arrow";
import CCoordinates from "@classes/components/content/connection_overview_2/CCoordinates";
import {setCurrentItem} from "@actions/connection_overview_2/set";


export let processes = [
    //case 1
    {
        x: 20, y: 20, label: 'Get Clients', invoker: 'i-doit',
        processes: [{
            id: 11, x: 20, y: 20, label: 'cmdb.objects.read', invoker: 'i-doit'},
            {id: 22, x: 240, y: 20, label: 'cmdb.category.read', invoker: 'i-doit'},],
        arrows: [{from: 11, to: 22}]
    },
    {
        x: 140, y: 20, label: 'Find Tickets', invoker: 'otrs',
        processes: [{id: 11, x: 20, y: 20, label: 'ConfigItemSearch', invoker: 'otrs'},
            {id: 22, x: 240, y: 20, label: 'ConfigItemCreate', invoker: 'otrs'},],
        arrows: [{from: 11, to: 22}]

    },/*
    {x: 240, y: 20, label: 'Case1.0.C', invoker: 'sensu',
        processes: [{id: 11, x: 20, y: 20, label: 'Case1.1.C', invoker: 'sensu'},
            {id: 22, x: 140, y: 20, label: 'Case1.2.C', invoker: 'sensu'},],
        arrows: [{from: 11, to: 22}]},
    //case 2
    {x: 20, y: 100, label: 'Case2.0.A', invoker: 'otrs'},
    {x: 60, y: 100, label: 'Case2.0.B', invoker: 'otrs'},
    {x: 20, y: 180, label: 'Case2.1.A', invoker: 'otrs'},
    {x: 20, y: 180, label: 'Case2.1.B', invoker: 'otrs'},
    {x: 60, y: 260, label: 'Case2.2.A', invoker: 'otrs'},
    {x: 20, y: 260, label: 'Case2.2.B', invoker: 'otrs'},
    //case 3
    {x: 140, y: 340, label: 'Case3.0.A', invoker: 'otrs'},
    {x: 20, y: 340, label: 'Case3.0.B', invoker: 'otrs'},
    //case 4
    {x: 250, y: 20, label: 'Case4.0.A', invoker: 'otrs'},
    {x: 400, y: 30, label: 'Case4.0.B', invoker: 'otrs'},
    {x: 250, y: 230, label: 'Case4.0.A', invoker: 'otrs'},
    {x: 400, y: 220, label: 'Case4.0.B', invoker: 'otrs'},
    //case 5
    {x: 250, y: 100, label: 'Case5.0.A', invoker: 'otrs'},
    {x: 400, y: 170, label: 'Case5.0.B', invoker: 'otrs'},
    //case 6
    {x: 250, y: 180, label: 'Case6.0.A', invoker: 'otrs'},
    {x: 300, y: 300, label: 'Case6.0.B', invoker: 'otrs'},
    {x: 600, y: 300, label: 'Case6.1.A', invoker: 'otrs'},
    {x: 560, y: 400, label: 'Case6.1.B', invoker: 'otrs'},
    //case 7
    {x: 550, y: 20, label: 'Case7.0.A', invoker: 'otrs'},
    {x: 550, y: 100, label: 'Case7.0.B', invoker: 'otrs'},
    //case 8
    {x: 550, y: 200, label: 'Case8.0.A', invoker: 'otrs'},
    {x: 550, y: 220, label: 'Case8.0.B', invoker: 'otrs'},
    {x: 1050, y: 400, label: 'Case8.1.A', invoker: 'otrs'},
    {x: 1050, y: 370, label: 'Case8.1.B', invoker: 'otrs'},
    //case 9
    {x: 870, y: 20, label: 'Case9.0.A', invoker: 'otrs'},
    {x: 750, y: 120, label: 'Case9.0.B', invoker: 'otrs'},
    //case 10
    {x: 900, y: 240, label: 'Case10.0.A', invoker: 'otrs'},
    {x: 750, y: 200, label: 'Case10.0.B', invoker: 'otrs'},
    //case 11
    {x: 900, y: 400, label: 'Case11.0.A', invoker: 'otrs'},
    {x: 750, y: 300, label: 'Case11.0.B', invoker: 'otrs'},
    //case 12
    {x: 1080, y: 120, label: 'Case12.0.A', invoker: 'otrs'},
    {x: 1050, y: 20, label: 'Case12.0.B', invoker: 'otrs'},
    {x: 1250, y: 120, label: 'Case12.1.A', invoker: 'otrs'},
    {x: 1270, y: 20, label: 'Case12.1.B', invoker: 'otrs'},
    //case 13
    {x: 1050, y: 300, label: 'Case13.0.A', invoker: 'otrs'},
    {x: 1050, y: 200, label: 'Case13.0.B', invoker: 'otrs'},
    //case 14
    {x: 1250, y: 350, label: 'Case14.0.A', invoker: 'otrs'},
    {x: 1380, y: 220, label: 'Case14.0.B', invoker: 'otrs'},*/
];

let arrows = [
    {from: 1, to: 2},
];

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentItem: connectionOverview.get('currentItem'),
    };
}

@connect(mapStateToProps, {setCurrentItem})
@SvgLayout({layoutId: 'business_layout', svgId: 'business_layout_svg', dragAndDropStep: 10, isDraggable: true})
class BusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.state = {
            processes: processes.map((process, key) => {return {...process, id: key + 1, height: PROCESS_HEIGHT, width: Math.ceil((process.label.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10}}),
            arrows,
        }
        this.svgRef = React.createRef();
    }

    componentDidMount() {
        const {onWheel} = this.props;
        this.svgRef.current.addEventListener('wheel', onWheel, { passive: false });
    }

    componentWillUnmount() {
        const {onWheel} = this.props;
        this.svgRef.current.removeEventListener('wheel', onWheel);
    }

    setCurrentProcess(currentProcess){
        let {processes} = this.state;
        if(currentProcess){
            let index = processes.findIndex(process => process.id === currentProcess.id);
            if(index !== -1) {
                processes.splice(index, 1);
                processes.push(currentProcess);
            }
        }
        this.props.setCurrentItem(currentProcess);
        this.setState({
            //currentProcess,
            processes,
        });
    }

    setProcessCoordinates(coordinates){
        const {currentItem} = this.props;
        let {processes} = this.state;
        if(currentItem) {
            this.setState({
                processes: processes.map(process => {
                    if (process.id === currentItem.id) {
                        return {...process, ...coordinates};
                    } else {
                        return process;
                    }
                })
            })
        }
    }
/*
    setArrowCoordinates(currentProcessCoordinates){
        const {currentItem} = this.props;
        let {arrows} = this.state;
        if(currentItem){
            let arrowIfFromProcess = arrows.find(arrow => arrow.from === currentItem.id);
            if(arrowIfFromProcess) this.setLinesCoordinates(arrowIfFromProcess, currentProcessCoordinates);
            let arrowIfToProcess = arrows.find(arrow => arrow.to === currentItem.id);
            if(arrowIfToProcess) this.setLinesCoordinates(arrowIfToProcess, currentProcessCoordinates);
        }
    }

    setLinesCoordinates(arrowConnection, currentProcessCoordinates){
        const {currentItem} = this.props;
        let {processes} = this.state;
        let fromProcess = processes.find(process => process.id === arrowConnection.from);
        let toProcess = processes.find(process => process.id === arrowConnection.to);
        if(currentItem.id === fromProcess.id){
            fromProcess = {...fromProcess, ...currentProcessCoordinates};
        }
        if(currentItem.id === toProcess.id){
            toProcess = {...toProcess, ...currentProcessCoordinates};
        }
        const {line1, line2, arrow} = CCoordinates.getLinkCoordinates(fromProcess, toProcess);
        const line1Elem = document.getElementById(`${arrowConnection.from}_${arrowConnection.to}_line1`);
        const line2Elem = document.getElementById(`${arrowConnection.from}_${arrowConnection.to}_line2`);
        const arrowElem = document.getElementById(`${arrowConnection.from}_${arrowConnection.to}_arrow`);
        if(line1){
            if(line1Elem){
                this.setLineCoordinate(line1Elem, line1);
            }
        } else{
            if(line1Elem){
                line1Elem.remove();
            }
        }
        if(line2){
            if(line2Elem){
                this.setLineCoordinate(line2Elem, line2);
            }
        }else{
            if(line2Elem){
                line2Elem.remove();
            }
        }
        if(arrow){
            if(arrowElem){
                this.setLineCoordinate(arrowElem, arrow);
            }
        }else{
            if(arrowElem){
                arrowElem.remove();
            }
        }
    }

    setLineCoordinate(elem, coordinate){
        elem.setAttribute('x1', coordinate.x1);
        elem.setAttribute('x2', coordinate.x2);
        elem.setAttribute('y1', coordinate.y1);
        elem.setAttribute('y2', coordinate.y2);
    }*/

    onMouseDown(e){
        const {startDrag} = this.props;
        startDrag(e);
    }

    onMouseMove(e){
        const {drag} = this.props;
        drag(e, ::this.setProcessCoordinates);
    }

    onMouseAway(){
        const {endDrag} = this.props;
        endDrag();
    }

    renderProcesses(){
        const {processes} = this.state;
        return processes.map((process,key) => {
            return(
                <Process key={key} process={process} setCurrentProcess={::this.setCurrentProcess}/>
            );
        });
    }

    renderOperators(){
        const operators = [
            //{type: 'if', x: 220, y: 100,},
        ];
        return operators.map((operator,key) => {
            switch (operator.type){
                case 'if':
                    return(
                        <IfOperator key={key} x={operator.x} y={operator.y}/>
                    );
            }
            return null;
        });
    }

    renderArrows(){
        return this.state.arrows.map((arrow,key) => {
            const from = this.state.processes.find(process => process.id === arrow.from);
            const to = this.state.processes.find(process => process.id === arrow.to);
            return(
                <Arrow key={key} {...arrow} from={from} to={to}/>
            );
        });
    }

    render(){
        const {viewBox} = this.props;
        const {x, y, width, height} = viewBox;
        return(
            <svg
                id={'business_layout_svg'}
                className={styles.business_layout_svg}
                viewBox={`${x} ${y} ${width} ${height}`}
                preserveAspectRatio={'xMidYMid slice'}
                onMouseDown={::this.onMouseDown}
                onMouseMove={::this.onMouseMove}
                onMouseUp={::this.onMouseAway}
                onMouseLeave={::this.onMouseAway}
                ref={this.svgRef}
            >
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
                {
                    this.renderArrows()
                }
                {
                    this.renderOperators()
                }
                {
                    this.renderProcesses()
                }
            </svg>
        );
    }
}

export default BusinessLayout;