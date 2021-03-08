import React from 'react';
import Graph from "react-graph-vis";
import {BUSINESS_NODES, BUSINESS_EDGES} from "@components/content/connection_overview_2/data";

class BusinessLayout extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const graph = {
            nodes: BUSINESS_NODES,
            edges: BUSINESS_EDGES,
        };
        const options = {
            manipulation: false,
            height: "90%",
            layout: {
                hierarchical: {
                    enabled: false,
                    levelSeparation: 300,
                },
            },
            physics: {
                enabled: false,
            },
        };
        const events = {};
        return(
            <Graph
                style={{
                    backgroundPosition: 'center center',
                    width: '100%',
                    height: '100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'contain',
                }}
                graph={graph}
                options={options}
                events={events}
                getNetwork={network => {
                    const that = this;
                    network.on("click", function(params) {
                        console.log(params)

                    });
                    network.on("dragEnd", function(params) {
                        console.log(params)
                    });
                    network.on("initRedrew", function(params) {
                        console.log(params)
                    });
                }}
            />
        );
    }
}

export default BusinessLayout;