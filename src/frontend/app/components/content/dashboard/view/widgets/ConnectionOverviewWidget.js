import React from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from "three";

import styles from '@themes/default/content/dashboard/dashboard.scss';
import {ListComponent} from "@decorators/ListComponent";
import {connect} from "react-redux";
import {fetchConnections, fetchConnectionsCanceled} from "@actions/connections/fetch";
import SubHeader from "@components/general/view_component/SubHeader";

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
    }

    render(){
        const {connections, authUser} = this.props;
        let fromInvokerIcons = Array.from(new Set(connections.map(c => c.fromConnector.icon)));
        let toInvokerIcons = Array.from(new Set(connections.map(c => c.toConnector.icon)));
        let allIcons = [...fromInvokerIcons, ...toInvokerIcons];
        const gData = {
            nodes: [
                {id: 0, img: '../../../../../../../img/open_celium_graph_icon.png'}
            ],
            links: [
            ]
        };
        for(let i = 0; i < allIcons.length; i++){
            gData.nodes.push({id: i + 1, img: allIcons[i]});
            gData.links.push({source: 0, target: i + 1});
        }
        return(
            <div className={styles.connection_overview_widget}>
                <SubHeader title={'Connection Overview'} authUser={authUser} className={styles.widget_subheader}/>
                <ForceGraph3D
                    backgroundColor={'white'}
                    graphData={gData}
                    nodeThreeObject={({ img }) => {
                        const loader = new THREE.TextureLoader();
                        loader.setCrossOrigin('anonymous')
                        const imgTexture = loader.load(`${img}`);
                        const material = new THREE.SpriteMaterial({ map: imgTexture });
                        const sprite = new THREE.Sprite(material);
                        sprite.scale.set(100, 100);
                        return sprite;
                    }}
                />
            </div>
        );
    }
}

export default ConnectionOverviewWidget;