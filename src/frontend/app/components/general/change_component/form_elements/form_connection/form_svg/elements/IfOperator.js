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
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";


class IfOperator extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.operator);
    }

    render(){
        const {operator, isNotDraggable, isCurrent, isHighlighted} = this.props;
        const textX = '50%';
        const textY = '50%';
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} onMouseDown={::this.onMouseDown} points={points}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {'if'}
                </text>
            </svg>
        );
    }
}

IfOperator.propTypes = {
    operator: PropTypes.oneOfType([
        PropTypes.instanceOf(CTechnicalOperator),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
};

IfOperator.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
};

export default IfOperator;