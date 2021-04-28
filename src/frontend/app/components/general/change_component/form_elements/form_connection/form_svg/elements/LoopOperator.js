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
import {mapItemsToClasses} from "../utils";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";


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
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${isCurrentOperator ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? '' : `${styles.process_rect_draggable} draggable`}`} onMouseDown={::this.onMouseDown} points={points}/>
                <svg fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={'55'} y={'10'}>
                    {operator.entity.iterator}
                </text>
            </svg>
        );
    }
}

LoopOperator.propTypes = {
    operator: PropTypes.oneOfType([
        PropTypes.instanceOf(CTechnicalOperator),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
};

LoopOperator.defaultProps = {
    isNotDraggable: false,
};

export default LoopOperator;