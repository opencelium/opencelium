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
        const textX = '44%';
        const textY = '50%';
        return(
            <svg x={x} y={y} width={width} height={height}>
                <rect x={40} y={-20} rx={borderRadius} ry={borderRadius} width={rectWidth} height={rectHeight} className={styles.if_operator}/>
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
    label: PropTypes.string.isRequired,
};

export default IfOperator;