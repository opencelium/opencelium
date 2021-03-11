import React from 'react';
import Graph from "react-graph-vis";
import {PROGRAM_EDGES, PROGRAM_NODES} from "@components/content/connection_overview_2/data";

class ProgramLayout extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const graph = {
            nodes: PROGRAM_NODES,
            edges: PROGRAM_EDGES,
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

                    });
                    network.on("initRedrew", function(params) {
                        console.log(params)
                    });
                }}
            />
        );
    }
}

export default ProgramLayout;