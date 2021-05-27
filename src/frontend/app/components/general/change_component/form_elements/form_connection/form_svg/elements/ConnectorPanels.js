import React from 'react';
import ConnectorPanel from "@change_component/form_elements/form_connection/form_svg/elements/Panel";

const ARROW_INTEND_TOP = 50;


class ConnectorPanels extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.props;
        const hasLine = toConnectorPanelParams && toConnectorPanelParams.panelPosition && toConnectorPanelParams.panelPosition.width > 0;
        return(
            <React.Fragment>
                <ConnectorPanel {...fromConnectorPanelParams} namePosition={'right'}/>
                <ConnectorPanel {...toConnectorPanelParams} namePosition={'left'}/>
                {hasLine && <line strokeDasharray="5, 5" x1={fromConnectorPanelParams.panelPosition.x + fromConnectorPanelParams.panelPosition.width} y1={ARROW_INTEND_TOP} x2={toConnectorPanelParams.panelPosition.x} y2={ARROW_INTEND_TOP} stroke="#656565"/>}
            </React.Fragment>
        );
    }
}

export default ConnectorPanels;