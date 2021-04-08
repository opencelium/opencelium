import React from 'react';
import PropTypes from 'prop-types';
import {connect} from "react-redux";
import {mapItemsToClasses} from "@components/content/connection_overview_2/utils";
import styles from "@themes/default/content/connections/connection_overview_2";

function mapStateToProps(state){
    const {currentItem} = mapItemsToClasses(state);
    return{
        //currentItem,
    };
}

@connect(mapStateToProps, {})
class NewElementPanel extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {currentItem} = this.props;
        if(!currentItem){
            return null;
        }
        const points = `${25 / 2},1 ${25 - 1},${25 / 2} ${25 / 2},${25 - 1} 1,${25 / 2}`;
        const panelPosition = {x: currentItem.x, y: currentItem.y - 20};
        const newProcessPosition = {x: currentItem.width + 5, y: 1};
        const newOperatorPosition = {x: currentItem.width + 7.5, y: 30};
        return(
            <svg x={panelPosition.x} y={panelPosition.y}>
                <rect className={styles.new_process_icon} x={newProcessPosition.x} y={newProcessPosition.y} rx={"5"} ry={"5"} width="30" height={"20"}/>
                <svg className={styles.new_operator_icon} x={newOperatorPosition.x} y={newOperatorPosition.y}>
                    <polygon points={points}/>
                </svg>
            </svg>
        );
    }
}

export default NewElementPanel;