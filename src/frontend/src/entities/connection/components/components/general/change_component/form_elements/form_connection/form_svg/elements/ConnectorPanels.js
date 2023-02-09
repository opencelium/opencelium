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
import ConnectorPanel from "@change_component/form_elements/form_connection/form_svg/elements/Panel";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";

const ARROW_INTEND_TOP = 50;


class ConnectorPanels extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {fromConnectorPanelParams, toConnectorPanelParams, connection, setIsCreateElementPanelOpened, createElementPanelConnectorType, readOnly} = this.props;
        const hasLine = toConnectorPanelParams && toConnectorPanelParams.panelPosition && toConnectorPanelParams.panelPosition.width > 0;
        const isFromConnectorEmpty = connection.fromConnector.svgItems.length === 0;
        const isToConnectorEmpty = connection.toConnector.svgItems.length === 0;
        return(
            <React.Fragment>
                <ConnectorPanel {...fromConnectorPanelParams} readOnly={readOnly} namePosition={'right'} connectorType={CONNECTOR_FROM} isEmpty={isFromConnectorEmpty} setIsCreateElementPanelOpened={setIsCreateElementPanelOpened} createElementPanelConnectorType={createElementPanelConnectorType}/>
                <ConnectorPanel {...toConnectorPanelParams} readOnly={readOnly} namePosition={'left'} connectorType={CONNECTOR_TO} isEmpty={isToConnectorEmpty} setIsCreateElementPanelOpened={setIsCreateElementPanelOpened} createElementPanelConnectorType={createElementPanelConnectorType}/>
                {hasLine && <line strokeDasharray="5, 5" x1={fromConnectorPanelParams.panelPosition.x + fromConnectorPanelParams.panelPosition.width} y1={ARROW_INTEND_TOP} x2={toConnectorPanelParams.panelPosition.x} y2={ARROW_INTEND_TOP} stroke="#656565"/>}
            </React.Fragment>
        );
    }
}

export default ConnectorPanels;