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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CBusinessOperator} from "@classes/components/content/connection_overview_2/operator/CBusinessOperator";
import {mapItemsToClasses} from "../utils";


function mapStateToProps(state){
    const {currentItem} = mapItemsToClasses(state);
    return{
        currentItem,
    };
}

@connect(mapStateToProps, {})
class LoopOperator extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.operator);
    }

    render(){
        const {currentItem, operator, isNotDraggable} = this.props;
        const isCurrentOperator = currentItem ? currentItem.id === operator.id : false;
        const textX = '50%';
        const textY = '50%';
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${isCurrentOperator ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? '' : `${styles.process_rect_draggable} draggable`}`} onMouseDown={::this.onMouseDown} points={points}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {'loop'}
                </text>
            </svg>
        );
    }
}

LoopOperator.propTypes = {
    operator: PropTypes.oneOfType([
        PropTypes.instanceOf(CBusinessOperator),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
};

LoopOperator.defaultProps = {
    isNotDraggable: false,
};

export default LoopOperator;