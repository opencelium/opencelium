import React from 'react';
import ConnectorPanel from "@change_component/form_elements/form_connection/form_svg/elements/Panel";

class ConnectorPanels extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {fromConnectorPanelParams, toConnectorPanelParams} = this.props;
        return(
            <React.Fragment>
                <ConnectorPanel {...fromConnectorPanelParams} namePosition={'right'}/>
                <ConnectorPanel {...toConnectorPanelParams} namePosition={'left'}/>
                <line strokeDasharray="5, 5" x1={fromConnectorPanelParams.x + fromConnectorPanelParams.width} y1={100} x2={toConnectorPanelParams.x} y2={100} stroke="#656565"/>
            </React.Fragment>
        );
    }
}

export default ConnectorPanels;