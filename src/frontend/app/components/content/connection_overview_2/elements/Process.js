import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2.scss";

export const PROCESS_HEIGHT = 50;

export const PROCESS_LABEL_PADDING = 5;

class Process extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            x: props.x,
            y: props.y,
        };

        this.selectedElement = false;
        this.offset = {x: 0, y: 0};
    }

    render(){
        const {label, x, y, width, height} = this.props;
        const borderRadius = 5;
        const textX = '50%';
        const textY = '50%';
        return(
            <svg x={x} y={y} className={`${styles.process} confine`} width={width} height={height}>
                <rect x={0} y={0} rx={borderRadius} ry={borderRadius} width={width} height={height} className={`${styles.process_rect} draggable`}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {label}
                </text>
            </svg>
        );
    }
}

Process.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
};

export default Process;