import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2.scss";

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
        const {label, x, y} = this.props;
        const rectPaddingSides = 5;
        let rectWidth = label.length * 9 + rectPaddingSides * 2;
        const borderRadius = 5;
        const rectHeight = 50;
        const textX = '50%';
        const textY = '50%';
        return(
            <svg x={x} y={y} className={`${styles.process}`} width={rectWidth} height={rectHeight}>
                <rect x={0} y={0} rx={borderRadius} ry={borderRadius} width={rectWidth} height={rectHeight} className={`${styles.process_rect} draggable`}/>
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