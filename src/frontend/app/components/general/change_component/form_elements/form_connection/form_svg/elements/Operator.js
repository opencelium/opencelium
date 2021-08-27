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
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {connect} from "react-redux";
import {setCurrentBusinessItem} from "@actions/connection_overview_2/set";
import {IF_OPERATOR, LOOP_OPERATOR} from "@classes/components/content/connection/operator/COperatorItem";
import Confirmation from "@components/general/app/Confirmation";
import {SvgItem} from "@decorators/SvgItem";
import COperator from "@classes/components/content/connection_overview_2/operator/COperator";



@connect(null, {setCurrentBusinessItem})
@SvgItem(COperator)
class Operator extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            polygonStyle: {},
        }
    }

    onMouseOver(){
        const {connection} = this.props;
        if(connection && connection.businessLayout.isInAssignMode) {
            this.setState({
                polygonStyle: {stroke: '#79c883'}
            });
        }
    }

    onMouseLeave(){
        const {connection} = this.props;
        if(connection && connection.businessLayout.isInAssignMode) {
            this.setState({
                polygonStyle: {},
            });
        }
    }

    onDoubleClick(){
        this.props.setIsCreateElementPanelOpened(true);
    }

    onClick(){
        const {connection, setCurrentItem, operator, isDisabled, assign, toggleReassignConfirmation} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        if(!isDisabled) {
            if (isAssignMode) {
                assign();
            } else {
                setCurrentItem(operator);
            }
        } else{
            if (isAssignMode) {
                toggleReassignConfirmation();
            }
        }
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
        const {polygonStyle} = this.state;
        const {connection, operator, isNotDraggable, isCurrent, isHighlighted, isAssignedToBusinessProcess, isDisabled} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        const closeX = 40;
        const closeY = 0;
        const assignStyle = isAssignMode && isAssignedToBusinessProcess ? styles.assigned_operator : '';
        const isDisabledStyle = isDisabled ? styles.disabled_operator : '';
        return(
            <svg x={operator.x} y={operator.y} className={`${isNotDraggable ? styles.not_draggable : ''} ${assignStyle} ${isDisabledStyle} ${styles.operator} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon onDoubleClick={::this.onDoubleClick} onClick={::this.onClick} onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave} style={polygonStyle} className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} points={points}/>
                <svg style={{pointerEvents: 'none'}} className={`${isNotDraggable ? styles.not_draggable : ''} ${styles.operator_loop_icon}`} fill="#000000" width="30px" height="30px" viewBox="0 0 24 24" x="15px" y="14px">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    <path d="M0 0h24v24H0z" fill="none"/>
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
        const {polygonStyle} = this.state;
        const {connection, operator, isNotDraggable, isCurrent, isHighlighted, readOnly, isAssignedToBusinessProcess, isDisabled} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        const textX = '50%';
        const textY = '50%';
        const closeX = 40;
        const closeY = 0;
        const points = `${operator.width / 2},1 ${operator.height - 1},${operator.width / 2} ${operator.width / 2},${operator.height - 1} 1,${operator.width / 2}`;
        const assignStyle = isAssignMode && isAssignedToBusinessProcess ? styles.assigned_operator : '';
        const isDisabledStyle = isDisabled ? styles.disabled_operator : '';
        return(
            <svg x={operator.x} y={operator.y} className={`${styles.operator} ${assignStyle} ${isDisabledStyle} ${isNotDraggable ? styles.not_draggable : ''} ${isHighlighted ? styles.highlighted_operator : ''} ${isCurrent ? styles.current_operator : ''} confine`} width={operator.width} height={operator.height}>
                <polygon onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave} style={polygonStyle} className={`${styles.operator_polygon} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`} onDoubleClick={::this.onDoubleClick} onClick={::this.onClick} points={points}/>
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
        return(
            <React.Fragment>
                {type === IF_OPERATOR && ::this.renderIfOperator()}
                {type === LOOP_OPERATOR && ::this.renderLoopOperator()}
            </React.Fragment>
        );
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
    isDisabled: PropTypes.bool,
};

Operator.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
    isDisabled: false,
};

export default Operator;