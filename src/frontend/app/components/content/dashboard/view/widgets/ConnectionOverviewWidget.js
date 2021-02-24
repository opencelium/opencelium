import React from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from "three";

import styles from '@themes/default/content/dashboard/dashboard.scss';
import {ListComponent} from "@decorators/ListComponent";
import {connect} from "react-redux";
import {fetchConnections, fetchConnectionsCanceled} from "@actions/connections/fetch";
import SubHeader from "@components/general/view_component/SubHeader";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import {isString} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    return {
        authUser: auth.get('authUser'),
        connections: connections.get('connections').toJS(),
        fetchingConnections: connections.get('fetchingConnections'),
    };
}

@connect(mapStateToProps, {fetchConnections, fetchConnectionsCanceled})
@ListComponent('connections', true)
class ConnectionOverviewWidget extends React.Component{
    constructor(props) {
        super(props);

        this.forceGraph3D = React.createRef();
    }

    componentDidMount() {
        this.forceGraph3D.current.d3Force("link").distance(150);
    }

    render(){
        const {connections, authUser} = this.props;
        let fromInvokerIcons = Array.from(new Set(connections.map((c, key) => CConnectorItem.hasIcon(c.fromConnector.icon) ? c.fromConnector.icon : CConnectorItem.hasIcon(c.fromConnector.invoker.icon) ? c.fromConnector.invoker.icon : key)));
        let toInvokerIcons = Array.from(new Set(connections.map((c, key) => CConnectorItem.hasIcon(c.toConnector.icon) ? c.toConnector.icon : CConnectorItem.hasIcon(c.toConnector.invoker.icon) ? c.toConnector.invoker.icon : key)));
        let allIcons = [...fromInvokerIcons, ...toInvokerIcons];
        const gData = {
            nodes: [
            ],
            links: [
            ]
        };
        for(let i = 0; i < allIcons.length; i++){
            gData.nodes.push({id: i, img: isString(allIcons[i]) ? allIcons[i] : '../../../../../../../img/default_connector.png'});
            gData.links.push({source: i, target: allIcons.length});
        }
        gData.nodes.push({id: allIcons.length, img: '../../../../../../../img/open_celium_graph_icon.png'});
        return(
            <div className={styles.connection_overview_widget}>
                <SubHeader title={'Connection Overview'} authUser={authUser} className={styles.widget_subheader}/>
                <ForceGraph3D
                    ref={this.forceGraph3D}
                    nodeRelSize={5}
                    backgroundColor={'white'}
                    linkColor={() => '#000'}
                    linkOpacity={0.3}
                    graphData={gData}
                    nodeThreeObject={({ img, id }) => {
                        const loader = new THREE.TextureLoader();
                        const imgTexture = loader.load(`${img}`);
                        const material = new THREE.MeshBasicMaterial({ map: imgTexture, transparent: true, opacity: 1 });
                        const circle = new THREE.CircleGeometry(30, 30)
                        const mesh = new THREE.Mesh(circle, material);
                        return mesh;
                    }}
                />
            </div>
        );
    }
}

export default ConnectionOverviewWidget;