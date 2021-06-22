import React from 'react';
import ConnectorPanel from "@change_component/form_elements/form_connection/form_svg/elements/Panel";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";

const ARROW_INTEND_TOP = 50;


class ConnectorPanels extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {fromConnectorPanelParams, toConnectorPanelParams, connection, setIsCreateElementPanelOpened, createElementPanelConnectorType} = this.props;
        const hasLine = toConnectorPanelParams && toConnectorPanelParams.panelPosition && toConnectorPanelParams.panelPosition.width > 0;
        const isFromConnectorEmpty = connection.fromConnector.svgItems.length === 0;
        const isToConnectorEmpty = connection.toConnector.svgItems.length === 0;
        return(
            <React.Fragment>
                <ConnectorPanel {...fromConnectorPanelParams} namePosition={'right'} connectorType={CONNECTOR_FROM} isEmpty={isFromConnectorEmpty} setIsCreateElementPanelOpened={setIsCreateElementPanelOpened} createElementPanelConnectorType={createElementPanelConnectorType}/>
                <ConnectorPanel {...toConnectorPanelParams} namePosition={'left'} connectorType={CONNECTOR_TO} isEmpty={isToConnectorEmpty} setIsCreateElementPanelOpened={setIsCreateElementPanelOpened} createElementPanelConnectorType={createElementPanelConnectorType}/>
                {hasLine && <line strokeDasharray="5, 5" x1={fromConnectorPanelParams.panelPosition.x + fromConnectorPanelParams.panelPosition.width} y1={ARROW_INTEND_TOP} x2={toConnectorPanelParams.panelPosition.x} y2={ARROW_INTEND_TOP} stroke="#656565"/>}
            </React.Fragment>
        );
    }
}

export default ConnectorPanels;