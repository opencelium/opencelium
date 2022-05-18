/*
 * Copyright (C) <2022>  <becon GmbH>
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

import ReactDOM from "react-dom";
import React, {FC, useEffect, useState} from 'react';
import Graph from "react-graph-vis";
import {isValidIconUrl} from "@application/utils/utils";
import {OC_NAME, OC_DESCRIPTION, API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {useAppDispatch} from "@application/utils/store";
import Toast from "@app_component/base/toast/Toast";
import {ContentLoading} from "@app_component/base/loading/ContentLoading";
import OpenCeliumImagePath from "@image/logo.png";
import DefaultConnectorImagePath from "@image/application/default_image.png";
import OpenCeliumBackgroundImagePath from "@image/application/oc_connection_widget_background.png"
import {Connection} from "@entity/connection/classes/Connection";
import {getAllConnections} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {ConnectionOverviewTitle, ConnectionOverviewWidgetStyled} from './styles';

const ConnectionOverviewWidget: FC =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {connections, gettingConnections} = Connection.getReduxState();
    const [nodes, setNodes] = useState([]);
    const [graph, setGraph] = useState({nodes: [], edges: []});
    const [hasConnections, setHasConnections] = useState<boolean>(false);
    useEffect(() => {
        dispatch(getAllConnections());
    }, [])
    useEffect(() => {
        if(gettingConnections === API_REQUEST_STATE.FINISH) {
            const usedConnectors: any[] = [...connections.map(connection => connection.fromConnector), ...connections.map(connection => connection.toConnector)];
            let newNodes = [];
            for (let i = 0; i < usedConnectors.length; i++) {
                if (newNodes.findIndex(c => c.id === usedConnectors[i].connectorId) === -1) {
                    let description = usedConnectors[i].invoker.description;
                    let image = isValidIconUrl(usedConnectors[i].icon) ? usedConnectors[i].icon : isValidIconUrl(usedConnectors[i].invoker.icon) ? usedConnectors[i].invoker.icon : DefaultConnectorImagePath;
                    newNodes.push({
                        id: usedConnectors[i].connectorId,
                        title: usedConnectors[i].title,
                        description,
                        shape: 'circularImage',
                        brokenImage: DefaultConnectorImagePath,
                        image,
                    });
                }
            }
            newNodes.push({
                id: OC_NAME,
                title: OC_NAME,
                description: OC_DESCRIPTION,
                shape: 'circularImage',
                brokenImage: OpenCeliumImagePath,
                image: OpenCeliumImagePath,
                size: 32,
            })
            const newGrapth = {
                nodes: newNodes,
                edges: [
                    ...newNodes.slice(0, newNodes.length - 1).map(node => {
                        return {from: node.id, to: OC_NAME, arrows: {from: false, to: false}};
                    })
                ]
            };
            setNodes(newNodes);
            setGraph(newGrapth);
            setHasConnections(true);
        }
    }, [connections]);

    const options = {
        physics: {
            stabilization: true
        },
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
    if(!hasConnections){
        return (
            <ContentLoading/>
        )
    }
    return (
        <ConnectionOverviewWidgetStyled >
            <ConnectionOverviewTitle title={'Connection Overview'}/>
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
                events={{
                    select: function(event: any) {
                        const { nodes, edges } = event;
                    }
                }}
                getNetwork={(network:any) => {
                    network.on("click", function(params: any) {
                        const selectedNodeId = params.nodes.length === 1 ? params.nodes[0] : null;
                        let domElement = null;
                        if(selectedNodeId){
                            const {x, y} = params.pointer.DOM;
                            const selectedNode = nodes.find(node => node.id === selectedNodeId);
                            if(selectedNode) {
                                const header = selectedNode.title;
                                const body = selectedNode.description;
                                domElement = <Toast header={header} body={body} left={x} top={y}/>;
                            }
                        }
                        ReactDOM.render(domElement, document.getElementById('connection_overview_description'));
                    });
                    network.on("initRedrew", function(params: any) {
                        // Get the node ID
                    });
                }}
            />
        </ConnectionOverviewWidgetStyled>
    )
}

ConnectionOverviewWidget.defaultProps = {
}


export {
    ConnectionOverviewWidget,
};
