import React from 'react';
import Process, {
    PROCESS_HEIGHT,
    PROCESS_LABEL_PADDING
} from "@components/content/connection_overview_2/elements/Process";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";
import SvgLayout from "@decorators/SvgLayout";
import {connect} from "react-redux";
import {setCurrentItem, setCurrentSubItem} from "@actions/connection_overview_2/set";
import CCoordinates from "@classes/components/content/connection_overview_2/CCoordinates";
import Arrow from "@components/content/connection_overview_2/elements/Arrow";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentProcess: connectionOverview.get('currentItem'),
    };
}

@connect(mapStateToProps, {setCurrentItem, setCurrentSubItem})
@SvgLayout({layoutId: 'program_layout', svgId: 'program_layout_svg', dragAndDropStep: 10, isDraggable: false})
class ProgramLayout extends React.Component{

    constructor(props) {
        super(props);
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

    setCurrentSubProcess(currentSubProcess){
        const {currentProcess} = this.props;
        if(currentSubProcess){
            let index = currentProcess.processes.findIndex(process => process.id === currentSubProcess.id);
            if(index !== -1) {
                currentProcess.processes.splice(index, 1);
                currentProcess.processes.push(currentSubProcess);
            }
        }
        this.props.setCurrentItem(currentProcess);
        this.props.setCurrentSubItem(currentSubProcess);
    }

    setProcessCoordinates(coordinates){
        const {currentProcess} = this.props;
        let {processes} = this.state;
        if(currentProcess) {
            this.setState({
                processes: processes.map(process => {
                    if (process.id === currentProcess.id) {
                        return {...process, ...coordinates};
                    } else {
                        return process;
                    }
                })
            })
        }
    }

    setArrowCoordinates(currentProcessCoordinates){
        const {currentProcess} = this.props;
        let {arrows} = this.state;
        if(currentProcess){
            let arrowIfFromProcess = arrows.find(arrow => arrow.from === currentProcess.id);
            if(arrowIfFromProcess) this.setLinesCoordinates(arrowIfFromProcess, currentProcessCoordinates);
            let arrowIfToProcess = arrows.find(arrow => arrow.to === currentProcess.id);
            if(arrowIfToProcess) this.setLinesCoordinates(arrowIfToProcess, currentProcessCoordinates);
        }
    }

    setLinesCoordinates(arrowConnection, currentProcessCoordinates){
        const {currentProcess} = this.props;
        let {processes} = this.state;
        let fromProcess = processes.find(process => process.id === arrowConnection.from);
        let toProcess = processes.find(process => process.id === arrowConnection.to);
        if(currentProcess.id === fromProcess.id){
            fromProcess = {...fromProcess, ...currentProcessCoordinates};
        }
        if(currentProcess.id === toProcess.id){
            toProcess = {...toProcess, ...currentProcessCoordinates};
        }
        const {line1, line2, arrow} = CCoordinates.getLinkCoordinates(fromProcess, toProcess);
        const svgElem = document.getElementById(`${arrowConnection.from}_${arrowConnection.to}_arrow`);
        if(line1){
            let line1Elem = svgElem.querySelector('.line1');
            if(line1Elem){
                this.setLineCoordinate(line1Elem, line1);
            }
        }
        if(line2){
            let line2Elem = svgElem.querySelector('.line2');
            if(line2Elem){
                this.setLineCoordinate(line2Elem, line2);
            }
        }
        if(arrow){
            let arrowElem = svgElem.querySelector('.arrow');
            if(arrowElem){
                this.setLineCoordinate(arrowElem, arrow);
            }
        }
    }

    setLineCoordinate(elem, coordinate){
        elem.setAttribute('x1', coordinate.x1);
        elem.setAttribute('x2', coordinate.x2);
        elem.setAttribute('y1', coordinate.y1);
        elem.setAttribute('y2', coordinate.y2);
    }

    onMouseDown(e){
        const {startDrag} = this.props;
        startDrag(e);
    }

    onMouseMove(e){
        const {drag} = this.props;
        drag(e, ::this.setProcessCoordinates);
    }

    onMouseAway(e){
        const {endDrag} = this.props;
        endDrag(e);
    }

    renderProcesses(){
        const {currentProcess} = this.props;
        if(currentProcess) {
            const {processes} = currentProcess;
            return processes.map((process, key) => {
                process.height = PROCESS_HEIGHT;
                process.width = Math.ceil((process.label.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10;
                return (
                    <Process key={key} process={process} setCurrentProcess={::this.setCurrentSubProcess} isNotDraggable={true}/>
                );
            });
        }
        return null;
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
        const {currentProcess} = this.props;
        if(currentProcess) {
            const {arrows, processes} = currentProcess;
            return arrows.map((arrow, key) => {
                let from = processes.find(process => process.id === arrow.from);

                from.height = PROCESS_HEIGHT;
                from.width = Math.ceil((from.label.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10;
                let to = processes.find(process => process.id === arrow.to);

                to.height = PROCESS_HEIGHT;
                to.width = Math.ceil((to.label.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10;
                return (
                    <Arrow key={key} {...arrow} from={from} to={to}/>
                );
            });
        }
        return null;
    }

    render(){
        const {viewBox} = this.props;
        const {x, y, width, height} = viewBox;
        return(
            <svg
                id={'program_layout_svg'}
                className={styles.business_layout_svg}
                viewBox={`${x} ${y} ${width} ${height}`}
                preserveAspectRatio={'xMidYMid slice'}
                onMouseDown={::this.onMouseDown}
                onMouseMove={::this.onMouseMove}
                onMouseUp={::this.onMouseAway}
                onMouseLeave={::this.onMouseAway}
                ref={this.svgRef}
            >
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

export default ProgramLayout;