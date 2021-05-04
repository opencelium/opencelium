import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2";

class Panel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {x, y, width, height, invokerName, namePosition} = this.props;
        const textX = namePosition === 'right' ? width : 2;
        return(
            <svg x={x} y={y} width={width} height={height}>
                <rect x={1} y={41} width={width - 2} height={height - 43} className={styles.connector_item_panel}/>
                <text textAnchor={namePosition === 'right' ? "end" : "start"} x={textX} y={'30'} className={styles.connector_item_text}>
                    {invokerName}
                </text>
            </svg>
        );
    }
}

Panel.propTypes = {
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    invokerName: PropTypes.string.isRequired,
    namePosition: PropTypes.string,
};

Panel.defaultProps = {
    namePosition: 'right',
};

export default Panel;