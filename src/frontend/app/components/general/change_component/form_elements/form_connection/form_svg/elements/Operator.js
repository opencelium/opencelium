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


class Operator extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.operator);
    }

    deleteOperator(e){
        const {connection, operator, updateConnection, setCurrentItem} = this.props;
        const connector = connection.getConnectorByOperatorIndex(operator.entity);
        if(connector){
            if(connector.getConnectorType() === CONNECTOR_FROM){
                connection.removeFromConnectorOperator(operator.entity);
            } else{
                connection.removeToConnectorOperator(operator.entity);
            }
            updateConnection();
            const currentItem = connector.getCurrentItem();
            if(currentItem){
                const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                setCurrentItem(currentSvgElement);
            }
        }
        e.stopPropagation();
    }

    render(){
        const {type} = this.props;
        switch(type){
            case 'if':
                return COperator.renderIfOperator(this.props, {onSelect: ::this.onMouseDown, onDelete: ::this.deleteOperator})
            case 'loop':
                return COperator.renderLoopOperator(this.props, {onSelect: ::this.onMouseDown, onDelete: ::this.deleteOperator})
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