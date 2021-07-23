/*
 * Copyright (C) <2021>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import ReactDOM from "react-dom";

import Graph from "react-graph-vis";
import styles from '@themes/default/content/dashboard/dashboard.scss';
import {ListComponent} from "@decorators/ListComponent";
import {connect} from "react-redux";
import {fetchConnections, fetchConnectionsCanceled} from "@actions/connections/fetch";

import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import DefaultConnectorImagePath from "@images/default_connector.png";
import OCToast from "@basic_components/Toast";
import {OC_DESCRIPTION, OC_NAME} from "@utils/constants/app";
import SubHeader from "@components/general/view_component/SubHeader";
import OpenCeliumBackgroundImagePath from "@images/oc_connection_widget_background.png"
import OpenCeliumImagePath from "@images/logo.png";

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
        this.tooltip = document.createElement('div');
        document.body.appendChild(this.tooltip);
    }

    render(){
        const {authUser, connections} = this.props;
        let usedConnectors = [...connections.map(connection => connection.fromConnector), ...connections.map(connection => connection.toConnector)];
        let nodes = [];
        for(let i = 0; i < usedConnectors.length; i++){
            if(nodes.findIndex(c => c.id === usedConnectors[i].connectorId) === -1){
                /*
                * TODO: if u want to load connector description then change to usedConnectors[i].description
                *  but backend should send this data
                */
                let description = usedConnectors[i].invoker.description;
                let image = CConnectorItem.hasIcon(usedConnectors[i].icon) ? usedConnectors[i].icon : CConnectorItem.hasIcon(usedConnectors[i].invoker.icon) ? usedConnectors[i].invoker.icon : DefaultConnectorImagePath;
                nodes.push({
                    id: usedConnectors[i].connectorId,
                    title: usedConnectors[i].title,
                    description,
                    shape: 'circularImage',
                    brokenImage: DefaultConnectorImagePath,
                    image,
                });
            }
        }
        nodes.push({
            id: OC_NAME,
            title: OC_NAME,
            description: OC_DESCRIPTION,
            shape: 'circularImage',
            brokenImage: OpenCeliumImagePath,
            image: OpenCeliumImagePath,
            size: 32,
        })
        const graph = {
            nodes,
            edges: [
                ...nodes.slice(0, nodes.length - 1).map(node => {
                    return {from: node.id, to: OC_NAME, arrows: {from: false, to: false}};
                })
            ]
        };
        const options = {
            edges: {
                chosen: false,
                color: {
                    color: "#777777",
                    highlight: "#777777",
                },
                length: 100
            },
            nodes:{
                color: {
                    border: "#ffffff00",
                    background: "#ffffff00",
                    highlight:{
                        border: "#0062cc",
                        background: "#ffffff00",
                    }
                },
            }
        };

        const events = {
            select: function(event) {
                const { nodes, edges } = event;
            }
        };
        return (
            <div className={styles.connection_overview_widget}>
                <SubHeader title={'Connection Overview'} authUser={authUser} className={styles.widget_subheader}/>
                <Graph
                    style={{
                        backgroundImage: `url("${OpenCeliumBackgroundImagePath}")`,
                        backgroundPosition: 'center center',
                        width: '100%',
                        height: '100%',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        backgroundColor: '#fff',
                        borderRadius: '5px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    }}
                    graph={graph}
                    options={options}
                    events={events}
                    getNetwork={network => {
                        const that = this;
                        network.on("click", function(params) {
                            const selectedNodeId = params.nodes.length === 1 ? params.nodes[0] : null;
                            let domElement = null;
                            if(selectedNodeId){
                                const {x, y} = params.pointer.DOM;
                                const selectedNode = nodes.find(node => node.id === selectedNodeId);
                                if(selectedNode) {
                                    const header = selectedNode.title;
                                    const body = selectedNode.description;
                                    domElement = <OCToast header={header} body={body} left={x} top={y}/>;
                                }
                            }
                            ReactDOM.render(domElement, that.tooltip);
                        });
                        network.on("initRedrew", function(params) {
                            // Get the node ID
                        });
                    }}
                />
            </div>
        );
    }
}

export default ConnectionOverviewWidget;