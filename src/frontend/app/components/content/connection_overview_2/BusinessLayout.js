import React from 'react';
import Process, {
    PROCESS_HEIGHT,
    PROCESS_LABEL_PADDING
} from "@components/content/connection_overview_2/elements/Process";
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import IfOperator from "@components/content/connection_overview_2/elements/IfOperator";
import SvgLayout from "@decorators/SvgLayout";
import Arrow from "@components/content/connection_overview_2/elements/Arrow";


export let processes = [
    //case 1
    {x: 20, y: 20, label: 'Case1.0.A'},
    {x: 140, y: 20, label: 'Case1.0.B'},
    //case 2
    {x: 20, y: 100, label: 'Case2.0.A'},
    {x: 60, y: 100, label: 'Case2.0.B'},
    {x: 20, y: 180, label: 'Case2.1.A'},
    {x: 20, y: 180, label: 'Case2.1.B'},
    {x: 60, y: 260, label: 'Case2.2.A'},
    {x: 20, y: 260, label: 'Case2.2.B'},
    //case 3
    {x: 140, y: 340, label: 'Case3.0.A'},
    {x: 20, y: 340, label: 'Case3.0.B'},
    //case 4
    {x: 250, y: 20, label: 'Case4.0.A'},
    {x: 400, y: 30, label: 'Case4.0.B'},
    //case 5
    {x: 250, y: 100, label: 'Case5.0.A'},
    {x: 400, y: 170, label: 'Case5.0.B'},
    //case 6
    {x: 250, y: 180, label: 'Case6.0.A'},
    {x: 300, y: 300, label: 'Case6.0.B'},
    {x: 600, y: 300, label: 'Case6.1.A'},
    {x: 560, y: 400, label: 'Case6.1.B'},
    //case 7
    {x: 550, y: 20, label: 'Case7.0.A'},
    {x: 550, y: 100, label: 'Case7.0.B'},
    //case 8
    {x: 550, y: 200, label: 'Case8.0.A'},
    {x: 550, y: 220, label: 'Case8.0.B'},
    {x: 1050, y: 400, label: 'Case8.1.A'},
    {x: 1050, y: 370, label: 'Case8.1.B'},
    //case 9
    {x: 870, y: 20, label: 'Case9.0.A'},
    {x: 750, y: 120, label: 'Case9.0.B'},
    //case 10
    {x: 900, y: 240, label: 'Case10.0.A'},
    {x: 750, y: 200, label: 'Case10.0.B'},
    //case 11
    {x: 900, y: 400, label: 'Case11.0.A'},
    {x: 750, y: 300, label: 'Case11.0.B'},
    //case 12
    {x: 1080, y: 120, label: 'Case12.0.A'},
    {x: 1050, y: 20, label: 'Case12.0.B'},
    {x: 1250, y: 120, label: 'Case12.1.A'},
    {x: 1270, y: 20, label: 'Case12.1.B'},
    //case 13
    {x: 1050, y: 300, label: 'Case13.0.A'},
    {x: 1050, y: 200, label: 'Case13.0.B'},
    //case 14
    {x: 1250, y: 350, label: 'Case14.0.A'},
    {x: 1380, y: 220, label: 'Case14.0.B'},
];

let arrows = [];
for(let i = 0; i < processes.length; i += 2){
    arrows.push({from: i + 1, to: i + 2});
}

@SvgLayout({layoutId: 'business_layout', svgId: 'business_layout_svg', dragAndDropStep: 10})
class BusinessLayout extends React.Component{

    constructor(props) {
        super(props);
        this.svgRef = React.createRef();
        this.processes = processes.map((process, key) => {return {...process, id: key + 1, height: PROCESS_HEIGHT, width: Math.ceil((process.label.length * 9 + PROCESS_LABEL_PADDING * 2) / 10) * 10}});
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
        return this.processes.map((process,key) => {
            return(
                <Process key={key} {...process}/>
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
        return arrows.map((arrow,key) => {
            const from = this.processes.find(process => process.id === arrow.from);
            const to = this.processes.find(process => process.id === arrow.to);
            return(
                <Arrow key={key} {...arrow} from={from} to={to}/>
            );
        });
    }

    render(){
        const {viewBox, startDrag, drag, endDrag} = this.props;
        const {x, y, width, height} = viewBox;
        return(
            <svg
                id={'business_layout_svg'}
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
                {
                    this.renderArrows()
                }
            </svg>
        );
    }
}

export default BusinessLayout;