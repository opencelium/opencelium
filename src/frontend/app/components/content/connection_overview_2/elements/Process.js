import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    return{
        currentItem: connectionOverview.get('currentItem'),
        currentSubItem: connectionOverview.get('currentSubItem'),
    };
}

@connect(mapStateToProps, {})
class Process extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.process);
    }

    render(){
        const {currentItem, currentSubItem, process, isNotDraggable} = this.props;
        let isCurrentProcess = currentItem ? currentItem.id === process.id : false;
        if(!isCurrentProcess){
            isCurrentProcess = currentSubItem ? currentSubItem.id === process.id : false;
        }
        const borderRadius = 10;
        const textX = '50%';
        const textY = '50%';
        let label = process.label ? process.label : process.name;
        if(label.length > 12){
            label = `${label.substr(0, 9)}...`;
        }
        return(
            <svg x={process.x} y={process.y} className={`${styles.process} ${isCurrentProcess ? styles.current_process : ''} confine`} width={process.width} height={process.height}>
                <rect onMouseDown={::this.onMouseDown}  x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2} className={`${styles.process_rect} ${isNotDraggable ? '' : `${styles.process_rect_draggable} draggable`}`}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {label}
                </text>
            </svg>
        );
    }
}

Process.propTypes = {
    process: PropTypes.oneOfType([
        PropTypes.instanceOf(CBusinessProcess),
        PropTypes.instanceOf(CTechnicalProcess),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
};

Process.defaultProps = {
    isNotDraggable: false,
};

export default Process;