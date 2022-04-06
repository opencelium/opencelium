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
import { ConnectionOverviewWidgetStyled } from './styles';
import {Connection} from "@class/connection/Connection";
import DefaultConnectorImagePath from "@images/default_connector.png";
import OpenCeliumBackgroundImagePath from "@images/oc_connection_widget_background.png"
import OpenCeliumImagePath from "@images/logo.png";
import {isValidIconUrl} from "../../../utils";
import Toast from "@atom/toast/Toast";
import {WidgetTitle} from "@molecule/widget_title/WidgetTitle";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllConnections} from "@action/connection/ConnectionCreators";
import {OC_NAME, OC_DESCRIPTION} from "@interface/application/IApplication";

const ConnectionOverviewWidget: FC =
    ({

    }) => {
    const dispatch = useAppDispatch();
    let tooltip = document.createElement('div');
    document.body.appendChild(tooltip);
    const {connections} = Connection.getReduxState();
    const [usedConnectors, setUserConnectors] = useState([]);
    useEffect(() => {
        dispatch(getAllConnections());
    }, [])
    useEffect(() => {
        setUserConnectors([...connections.map(connection => connection.fromConnector), ...connections.map(connection => connection.toConnector)])
    }, [connections])
    let nodes: any[] = [];
    for(let i = 0; i < usedConnectors.length; i++){
        if(nodes.findIndex(c => c.id === usedConnectors[i].connectorId) === -1){
            /*
            * TODO: if u want to load connector description then change to usedConnectors[i].description
            *  but backend should send this data
            */
            let description = usedConnectors[i].invoker.description;
            let image = isValidIconUrl(usedConnectors[i].icon) ? usedConnectors[i].icon : isValidIconUrl(usedConnectors[i].invoker.icon) ? usedConnectors[i].invoker.icon : DefaultConnectorImagePath;
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
        select: function(event: any) {
            const { nodes, edges } = event;
        }
    };
    return (
        <ConnectionOverviewWidgetStyled >
            <WidgetTitle title={'Connection Overview'}/>
            <Graph
                style={{
                    backgroundImage: `url("${OpenCeliumBackgroundImagePath}")`,
                    width: '100%',
                    height: '100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                }}
                graph={graph}
                options={options}
                events={events}
                getNetwork={(network:any) => {
                    const that: any = this;
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
                        ReactDOM.render(domElement, that.tooltip);
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
