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
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";


class Operator extends React.Component{
    constructor(props) {
        super(props)
    }

    onDoubleClick(){
        this.props.setIsCreateElementPanelOpened(true);
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.operator);
    }

    deleteOperator(e){
        const {connection, operator, updateConnection, setCurrentItem} = this.props;
        const connector = connection.getConnectorByType(operator.connectorType);
        if(connector){
            if(connector.getConnectorType() === CONNECTOR_FROM){
                connection.removeFromConnectorOperator(operator.entity);
            } else{
                connection.removeToConnectorOperator(operator.entity);
            }
            updateConnection(connection);
            const currentItem = connector.getCurrentItem();
            if(currentItem){
                const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                setCurrentItem(currentSvgElement);
            }
        }
        e.stopPropagation();
    }

    renderLoopOperator(){
        const {operator, isNotDraggable, isCurrent, isHighlighted} = this.props;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        const closeX = 40;
        const closeY = 0;
        return(
            <svg x={operator.x} y={operator.y} className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} onDoubleClick={::this.onDoubleClick} onMouseDown={::this.onMouseDown} points={points}/>
                <svg className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`} onMouseDown={::this.onMouseDown} fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                    <path onMouseDown={::this.onMouseDown} d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    <path onMouseDown={::this.onMouseDown} d="M0 0h24v24H0z" fill="none"/>
                </svg>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={'40'} y={'42'}>
                    {operator.entity.iterator}
                </text>
                <title>
                    {'loop'}
                </title>
                {isCurrent &&
                <DeleteIcon svgX={closeX} svgY={closeY} onClick={::this.deleteOperator}/>
                }
            </svg>
        );
    }

    renderIfOperator(){
        const {operator, isNotDraggable, isCurrent, isHighlighted, readOnly} = this.props;
        const textX = '50%';
        const textY = '50%';
        const closeX = 40;
        const closeY = 0;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} onDoubleClick={::this.onDoubleClick} onMouseDown={::this.onMouseDown} points={points}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={textX} y={textY}>
                    {'if'}
                </text>
                <title>{'if'}</title>
                {isCurrent && !readOnly &&
                <DeleteIcon svgX={closeX} svgY={closeY} onClick={::this.deleteOperator}/>
                }
            </svg>
        );
    }

    render(){
        const {type} = this.props;
        switch(type){
            case 'if':
                return ::this.renderIfOperator();
            case 'loop':
                return ::this.renderLoopOperator();
        }
        return null;
    }
}

Operator.propTypes = {
    operator: PropTypes.oneOfType([
        PropTypes.instanceOf(CTechnicalOperator),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentItem: PropTypes.func,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
};

Operator.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
};

export default Operator;