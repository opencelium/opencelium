import React from 'react';
import Process from "@components/content/connection_overview_2/elements/Process";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";
import SvgLayout from "@decorators/SvgLayout";

@SvgLayout({layoutId: 'program_layout', svgId: 'program_layout_svg', dragAndDropStep: 10})
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

    renderProcesses(){
        const processes = [
            {x: 20, y: 60, label: 'cmdb.objects.read'},
            {x: 20, y: 120, label: 'cmdb.category.read'},
            {x: 320, y: 60, label: 'findTickets'},
            {x: 220, y: 120, label: 'addTicket'},
            {x: 430, y: 120, label: 'saveTicket'},
        ];
        return processes.map((process,key) => {
            return(
                <Process key={key} x={process.x} y={process.y} label={process.label}/>
            );
        });

    }

    renderOperators(){
        const operators = [
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

    render(){
        const {viewBox, startDrag, drag, endDrag} = this.props;
        const {x, y, width, height} = viewBox;
        return(
            <svg
                id={'program_layout_svg'}
                className={styles.business_layout_svg}
                viewBox={`${x} ${y} ${width} ${height}`}
                preserveAspectRatio={'xMidYMid slice'}
                onMouseDown={startDrag}
                onMouseMove={drag}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                ref={this.svgRef}
            >
                {
                    this.renderProcesses()
                }
                {
                    this.renderOperators()
                }
            </svg>
        );
    }
}

export default ProgramLayout;