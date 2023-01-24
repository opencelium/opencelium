/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import PropTypes from 'prop-types';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";

class Panel extends React.Component{
    constructor(props) {
        super(props);
    }

    onClick(){
        const {isEmpty, setIsCreateElementPanelOpened, connectorType} = this.props;
        if(isEmpty) setIsCreateElementPanelOpened(true, connectorType);
    }

    render(){
        const {panelPosition, rectPosition, invokerName, namePosition, isEmpty, connectorType, createElementPanelConnectorType} = this.props;
        const textX = namePosition === 'right' ? panelPosition.width : 2;
        const hasPanelText = isEmpty && createElementPanelConnectorType !== connectorType;
        return(
            <React.Fragment>
                <svg id={`${connectorType}_panel`} x={panelPosition.x} y={panelPosition.y} width={panelPosition.width} height={panelPosition.height}>
                    <rect onClick={() => this.onClick()} x={rectPosition.x} y={rectPosition.y} width={rectPosition.width} height={rectPosition.height} className={styles.connector_item_panel} style={{cursor: isEmpty ? 'pointer' : 'move'}}/>
                    <text textAnchor={namePosition === 'right' ? "end" : "start"} x={textX} y={rectPosition.y - 6} className={styles.connector_item_text}>
                        {invokerName}
                    </text>
                    <text id={`${connectorType}_panel_text`} style={{opacity: hasPanelText ? 1 : 0}} onClick={() => this.onClick()} dominantBaseline={"middle"} textAnchor={"middle"} x={'50%'} y={'50%'} className={styles.connector_empty_text}>
                        {'Click here to create...'}
                    </text>
                    {/*<rect x={1} y={1} width={'100%'} height={'100%'} fill={'none'} stroke={'red'}/>*/}
                </svg>
            </React.Fragment>
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
    isEmpty: PropTypes.bool,
};

Panel.defaultProps = {
    namePosition: 'right',
    isEmpty: true,
};

export default Panel;