import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styles from "@themes/default/content/connections/connection_overview_2.scss";

export const PROCESS_HEIGHT = 50;

export const PROCESS_LABEL_PADDING = 5;

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentProcess: connectionOverview.get('currentItem'),
    };
}

@connect(mapStateToProps, {})
class Process extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentProcess(this.props.process);
    }

    render(){
        const {currentProcess, process, isNotDraggable} = this.props;
        const {label, x, y, width, height} = process;
        const isCurrentProcess = currentProcess ? currentProcess.id === process.id : false;
        const borderRadius = 5;
        const textX = '50%';
        const textY = '50%';
        return(
            <svg x={x} y={y} className={`${styles.process} ${isCurrentProcess ? styles.current_process : ''} confine`} width={width} height={height}>
                <rect onMouseDown={::this.onMouseDown}  x={0} y={0} rx={borderRadius} ry={borderRadius} width={width} height={height} className={`${styles.process_rect} ${isNotDraggable ? '' : `${styles.process_rect_draggable} draggable`}`}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {label}
                </text>
            </svg>
        );
    }
}

Process.propTypes = {
    process: PropTypes.shape({
        id: PropTypes.number.isRequired,
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        label: PropTypes.string.isRequired,
    }),
    isNotDraggable: PropTypes.bool,
};

Process.defaultProps = {
    isNotDraggable: false,
};

export default Process;