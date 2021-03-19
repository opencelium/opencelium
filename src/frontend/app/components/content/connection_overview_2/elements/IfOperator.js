import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2.scss";

class IfOperator extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {x, y} = this.props;
        const label = 'IF';
        const rectPaddingSides = 40;
        let width = 20 + rectPaddingSides * 2;
        let height = width;
        const rectWidth = width / 2;
        const rectHeight = rectWidth;
        const borderRadius = 5;
        const textX = '38%';
        const textY = '45%';
        return(
            <svg className={`${styles.if_operator} confine`} x={x} y={y} width={width} height={height}>
                <rect x={10} y={30} rx={borderRadius} ry={borderRadius} width={rectWidth} height={rectHeight} className={`${styles.if_operator_rect} draggable`}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {label}
                </text>
            </svg>
        );
    }
}

IfOperator.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
};

export default IfOperator;