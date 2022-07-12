/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React from 'react';
import PropTypes from 'prop-types';
import CCoordinates from "@entity/connection/components/classes/components/content/connection_overview_2/CCoordinates";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {connect} from "react-redux";
import {setCurrentBusinessItem} from "@root/redux_toolkit/slices/ConnectionSlice";
import COperator, {OPERATOR_SIZE} from "@classes/content/connection_overview_2/operator/COperator";

export const ARROW_WIDTH = 2;


function mapStateToProps(state){
    const {currentTechnicalItem} = mapItemsToClasses(state);
    return{
        currentTechnicalItem,
    }
}

@connect(mapStateToProps, {setCurrentBusinessItem})
class Arrow extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            isMouseOver: false,
        }
    }

    onMouseOver(){
        this.setState({
            isMouseOver: true,
        })
    }

    onMouseLeave(){
        this.setState({
            isMouseOver: false,
        })
    }

    render(){
        const {isMouseOver} = this.state;
        const {from, to, isHighlighted, isDisabled, currentTechnicalItem} = this.props;
        if(!from || !to){
            return null;
        }
        const isCurrentItemDragged = currentTechnicalItem && currentTechnicalItem.isDragged;
        const isDraggedInfoAvailable = isCurrentItemDragged && currentTechnicalItem.entity.index !== from.entity.index && currentTechnicalItem.entity.index !== to.entity.index;
        const isDraggableProcessOver = isMouseOver && isCurrentItemDragged && from.connectorType === currentTechnicalItem.connectorType;
        const isOperator = isDraggableProcessOver ? currentTechnicalItem instanceof COperator : false;
        let {line1, line2, arrow} = CCoordinates.getLinkCoordinates(from, to);
        const isDisabledStyle = isDisabled ? styles.disabled_arrow : '';
        const showPlaceholder = isDraggableProcessOver && currentTechnicalItem.entity.index !== from.entity.index && currentTechnicalItem.entity.index !== to.entity.index;
        const stroke = showPlaceholder ? '#00acc2' : '#000';
        const processPlaceholderX = line1 === null ? arrow.x1 - 15 + (arrow.x2 - arrow.x1) / 2 : line1.x1 - 15 + (arrow.x2 - line1.x1) / 2;
        const processPlaceholderY = line1 === null ? arrow.y1 - 10 + (arrow.y2 - arrow.y1) / 2 : line1.y1 - 10 + (arrow.y2 - line1.y1) / 2;
        const aroundConst = 40;
        const processPlaceholderBackgroundCoord = {x: line1 ? line1.x1 - aroundConst : arrow.x1 - aroundConst, y: line1 ? line1.y1 - aroundConst : arrow.y1 - aroundConst, width: line1 ? arrow.x2 - line1.x1 + aroundConst * 2 : arrow.x2 - arrow.x1 + aroundConst * 2, height: line1 ? arrow.y2 - line1.y1 + aroundConst * 2 : arrow.y2 - arrow.y1 + aroundConst * 2};
        let markerStyle = isHighlighted ? '_highlighted' : '';
        if(showPlaceholder){
            markerStyle = '_placeholder';
        }
        return(
            <React.Fragment>
                {line1 && <line id={`${from.id}_${to.id}_line1`} className={`${isDisabledStyle} ${isHighlighted ? styles.highlighted_arrow : ''} line1`} x1={line1.x1} y1={line1.y1} x2={line1.x2} y2={line1.y2} stroke={stroke}
                      strokeWidth={ARROW_WIDTH}/>}
                {line2 && <line id={`${from.id}_${to.id}_line2`} strokeLinecap={"round"} className={`${isDisabledStyle} ${isHighlighted ? styles.highlighted_arrow : ''} line2`} x1={line2.x1} y1={line2.y1} x2={line2.x2} y2={line2.y2} stroke={stroke}
                      strokeWidth={ARROW_WIDTH}/>}
                {arrow && <line id={`${from.id}_${to.id}_arrow`} className={`${isDisabledStyle} ${isHighlighted ? styles.highlighted_arrow : ''} arrow`} x1={arrow.x1} y1={arrow.y1} x2={arrow.x2} y2={arrow.y2} stroke={stroke}
                                strokeWidth={ARROW_WIDTH} markerEnd={`url(#arrow_head_right${markerStyle})`}/>}
                {showPlaceholder ?
                    !isOperator ?
                        <rect className={styles.process_placeholder} rx={5} ry={5} x={processPlaceholderX} y={processPlaceholderY} width={30} height={20}/>
                    :
                        <polygon className={styles.operator_placeholder} points={COperator.getPoints(processPlaceholderX, processPlaceholderY - 5, 30)}/>
                    : null
                }
                {isDraggedInfoAvailable && <rect id={`arrow_from__${from.id}__to__${to.id}`} onMouseOver={() => this.onMouseOver()} onMouseLeave={() => this.onMouseLeave()} className={styles.process_placeholder_background} {...processPlaceholderBackgroundCoord}/>}
            </React.Fragment>
        );
    }
}

Arrow.propTypes = {
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
    isHighlighted: PropTypes.bool,
    isDisabled: PropTypes.bool,
};

Arrow.defaultProps = {
    isHighlighted: false,
    isDisabled: false,
};

export default Arrow;