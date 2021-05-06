import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2";

class Panel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {panelPosition, rectPosition, invokerName, namePosition} = this.props;
        const textX = namePosition === 'right' ? panelPosition.width : 2;
        return(
            <svg x={panelPosition.x} y={panelPosition.y} width={panelPosition.width} height={panelPosition.height}>
                <rect x={rectPosition.x} y={rectPosition.y} width={rectPosition.width} height={rectPosition.height} className={styles.connector_item_panel}/>
                <text textAnchor={namePosition === 'right' ? "end" : "start"} x={textX} y={'30'} className={styles.connector_item_text}>
                    {invokerName}
                </text>
            </svg>
        );
    }
}

Panel.propTypes = {
    panelPosition: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    rectPosition: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
    }),
    invokerName: PropTypes.string.isRequired,
    namePosition: PropTypes.string,
};

Panel.defaultProps = {
    namePosition: 'right',
};

export default Panel;