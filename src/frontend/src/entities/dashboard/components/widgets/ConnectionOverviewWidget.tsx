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

import ReactDOM from "react-dom";
import React, {FC, useEffect, useMemo, useRef, useState} from 'react';
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
import {
    getAllConnections,
    getAllMetaConnections
} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import {ConnectionOverviewTitle, ConnectionOverviewWidgetStyled, WidgetCardHeaderStyled} from './styles';
import {Urls} from "@entity/application/requests/classes/url";

const TOAST_PORTAL_ID = 'connection_overview_description';

const ConnectionOverviewWidget: FC =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {metaConnections, gettingMetaConnections} = Connection.getReduxState();

    const [nodes, setNodes] = useState([]);
    const [graph, setGraph] = useState({nodes: [], edges: []});
    const [hasConnections, setHasConnections] = useState<boolean>(false);

    const networkRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const resizeTimerRef = useRef<number | null>(null);

    const hideToast = useMemo(() => {
        return () => {
            const portal = document.getElementById(TOAST_PORTAL_ID);
            ReactDOM.render(null, portal);
        };
    }, []);

    useEffect(() => {
        dispatch(getAllMetaConnections());
    }, [])
    useEffect(() => {
        if(gettingMetaConnections === API_REQUEST_STATE.FINISH) {
            const usedConnectors: any[] = [...metaConnections.map(connection => connection.fromConnector), ...metaConnections.map(connection => connection.toConnector)];
            let newNodes = [];
            for (let i = 0; i < usedConnectors.length; i++) {
                if (newNodes.findIndex(c => c.id === usedConnectors[i].connectorId) === -1) {
                    let description = usedConnectors[i].invoker.description;
                    const connectorIcon = Urls.baseUrl + usedConnectors[i].icon;
                    const invokerIcon = Urls.baseUrl + usedConnectors[i].invoker.icon;
                    let image = isValidIconUrl(connectorIcon) ? connectorIcon : isValidIconUrl(invokerIcon) ? invokerIcon : DefaultConnectorImagePath;
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
    }, [metaConnections, gettingMetaConnections]);

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            const container = containerRef.current;
            if (!container) return;
            const target = e.target as Node;

            if (!container.contains(target)) {
                hideToast();
            }
        };

        document.addEventListener('mousedown', onDocMouseDown, true);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown, true);
        };
    }, [hideToast]);

    useEffect(() => {
        if (!containerRef.current) return;

        const doResize = () => {
            const network = networkRef.current;
            if (!network) return;

            try {
                if (typeof network.setSize === 'function') {
                    network.setSize('100%', '100%');
                }
                if (typeof network.redraw === 'function') {
                    network.redraw();
                }
                if (typeof network.fit === 'function') {
                    network.fit({animation: false});
                }
            } catch (e) {}
        };

        const debounced = () => {
            if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
            resizeTimerRef.current = window.setTimeout(doResize, 80);
        };

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => debounced());
            ro.observe(containerRef.current);
        } else {
            window.addEventListener('resize', debounced);
        }

        return () => {
            if (resizeTimerRef.current) {
                window.clearTimeout(resizeTimerRef.current);
                resizeTimerRef.current = null;
            }
            if (ro) ro.disconnect();
            else window.removeEventListener('resize', debounced);
        };
    }, []);

    const options = useMemo(() => ({
        physics: {
            enabled: false
        },
        edges: {
            chosen: false,
            color: {
                color: "#777777",
                highlight: "#777777",
            },
            length: 100
        },
        interaction: {
            zoomView: false,
            hover: false,
            tooltipDelay: 0
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
    }), []);

    const renderToastAtDomPoint = (domLeft: number, domTop: number, selectedNode: any) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        let left = rect.left + domLeft + window.scrollX + 10;
        let top = rect.top + domTop + window.scrollY - 10;

        const padding = 8;
        const maxLeft = window.scrollX + window.innerWidth - padding;
        const maxTop = window.scrollY + window.innerHeight - padding;
        if (left > maxLeft) left = maxLeft;
        if (top > maxTop) top = maxTop;
        if (left < window.scrollX + padding) left = window.scrollX + padding;
        if (top < window.scrollY + padding) top = window.scrollY + padding;

        const portal = document.getElementById(TOAST_PORTAL_ID);

        ReactDOM.render(
            <Toast
                header={selectedNode.title}
                body={selectedNode.description}
                left={left}
                top={top}
            />,
            portal
        );
    };

    if(!hasConnections){
        return (
            <ContentLoading/>
        )
    }

    return (
        <ConnectionOverviewWidgetStyled >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                padding: '1vw 1.5vw 0.5vw 1vw',
                zIndex: 1,
            }}><WidgetCardHeaderStyled>{"Connection Overview"}</WidgetCardHeaderStyled></div>
            <div
                ref={containerRef}
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                }}
            >
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
                    getNetwork={(network:any) => {
                        networkRef.current = network;
                        try {
                            if (typeof network.off === 'function') {
                                network.off('click');
                                network.off('initRedraw');
                            }
                        } catch (e) {}

                        network.on("click", function(params: any) {
                            const selectedNodeId = params.nodes.length === 1 ? params.nodes[0] : null;

                            if(!selectedNodeId){
                                hideToast();
                                return;
                            }

                            const selectedNode = nodes.find(node => node.id === selectedNodeId);
                            if(!selectedNode){
                                hideToast();
                                return;
                            }

                            const domX = params.pointer?.DOM?.x ?? 0;
                            const domY = params.pointer?.DOM?.y ?? 0;

                            renderToastAtDomPoint(domX, domY, selectedNode);
                        });
                    }}
                />
            </div>
        </ConnectionOverviewWidgetStyled>
    );
}

ConnectionOverviewWidget.defaultProps = {
}


export {
    ConnectionOverviewWidget,
};
