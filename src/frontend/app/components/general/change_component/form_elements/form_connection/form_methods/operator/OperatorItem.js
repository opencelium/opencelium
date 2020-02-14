/*
 * Copyright (C) <2019>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from '../../../../../../../themes/default/general/form_methods.scss';

import DeleteIcon from "./DeleteIcon";
import CConnectorItem, {
    CONNECTOR_FROM,
    CONNECTOR_TO
} from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import COperatorItem, {
    IF_OPERATOR,
    LOOP_OPERATOR
} from "../../../../../../../classes/components/content/connection/operator/COperatorItem";
import IfOperator from "./IfOperator";
import LoopOperator from "./LoopOperator";
import TooltipFontIcon from "../../../../../basic_components/tooltips/TooltipFontIcon";


/**
 * Operator Item Component
 */
class OperatorItem extends Component{

    constructor(props){
        super(props);

        this.state = {
            hasDeleteButton: false,
            isVisibleMenuEdit: false,
        };
        this.isDisabledMouse = false;
        this.removingMethod = false;
    }

    /**
     * to toggle isVisibleMenuEdit
     */
    toggleIsVisibleMenuEdit(){
        this.setState({isVisibleMenuEdit: !this.state.isVisibleMenuEdit});
    }

    /**
     * to disable mouse actions
     */
    toggleDisableMouse(){
        this.isDisabledMouse = !this.isDisabledMouse;
    }

    /**
     * to show delete button
     */
    showDeleteButton(){
        const {readOnly} = this.props;
        if(!this.isDisabledMouse && !readOnly) {
            this.setState({
                hasDeleteButton: true,
            });
        }
    }

    /**
     * to hide delete button
     */
    hideDeleteButton(){
        if(!this.isDisabledMouse) {
            this.setState({
                hasDeleteButton: false,
            });
        }
    }

    /**
     * to remove operator
     */
    removeOperator(){
        const {connection, connector, operator, updateEntity} = this.props;
        let connectorType = connector.getConnectorType();
        switch (connectorType){
            case CONNECTOR_FROM:
                connection.removeFromConnectorOperator(operator);
                break;
            case CONNECTOR_TO:
                connection.removeToConnectorOperator(operator);
                break;
        }
        updateEntity();
    }

    /**
     * to set current item for operator
     */
    setCurrentItem(){
        const {connector, operator, updateEntity} = this.props;
        connector.setCurrentItem(operator);
        updateEntity();
    }

    getDepth(){
        const {operator} = this.props;
        let indexSplitted = operator.index.split('_');
        let depth = indexSplitted.length;
        if(depth >= 1) {
            depth--;
        }
        return depth;
    }

    renderOperatorType(){
        const {isVisibleMenuEdit} = this.state;
        const {connection, connector, operator, updateEntity, readOnly} = this.props;
          switch (operator.type){
            case IF_OPERATOR:
                return <IfOperator
                    tooltip={'if'}
                    readOnly={readOnly}
                    connection={connection}
                    connector={connector}
                    operator={operator}
                    updateEntity={updateEntity}
                    depth={::this.getDepth()}
                    isVisibleMenuEdit={isVisibleMenuEdit}
                    toggleIsVisibleMenuEdit={::this.toggleIsVisibleMenuEdit}
                    renderCloseMenuEditButton={::this.renderCloseMenuEditButton}
                />;
            case LOOP_OPERATOR:
                return <LoopOperator
                    tooltip={'loop'}
                    readOnly={readOnly}
                    connection={connection}
                    connector={connector}
                    operator={operator}
                    updateEntity={updateEntity}
                    depth={::this.getDepth()}
                    isVisibleMenuEdit={isVisibleMenuEdit}
                    toggleIsVisibleMenuEdit={::this.toggleIsVisibleMenuEdit}
                    renderCloseMenuEditButton={::this.renderCloseMenuEditButton}
                />;
        }
        return null;
    }

    renderDeleteIcon(){
        const {hasDeleteButton, isVisibleMenuEdit} = this.state;
        if(!hasDeleteButton || isVisibleMenuEdit){
            return null;
        }
        return(
            <DeleteIcon
                removeOperator={::this.removeOperator}
                disableMouseForOperator={::this.toggleDisableMouse}
            />
        );
    }

    renderCloseMenuEditButton(){
        return (
            <TooltipFontIcon
                className={styles.operator_close_menu_edit}
                value={'check_circle_outline'}
                tooltip={'Apply'}
                onClick={::this.toggleIsVisibleMenuEdit}
            />
        );
    }

    render(){
        const {connector, operator} = this.props;
        return (
            <div
                id={`${operator.index}__${connector.getConnectorType()}`}
                className={styles.operator}
                onMouseEnter={::this.showDeleteButton}
                onMouseLeave={::this.hideDeleteButton}
            >
                {this.renderOperatorType()}
                {this.renderDeleteIcon()}
            </div>
        );
    }
}

OperatorItem.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem),
    method: PropTypes.instanceOf(COperatorItem),
    updateEntity: PropTypes.func.isRequired,
};

export default OperatorItem;