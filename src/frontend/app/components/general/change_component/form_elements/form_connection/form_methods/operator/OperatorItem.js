/*
 * Copyright (C) <2020>  <becon GmbH>
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
import TooltipText from "../../../../../basic_components/tooltips/TooltipText";


/**
 * Operator Item Component
 */
class OperatorItem extends Component{

    constructor(props){
        super(props);

        this.state = {
            hasDeleteButton: false,
            isVisibleMenuEdit: false,
            isToggled: false,
            operatorClassName: '',
            isHidden: false,
        };
        this.isDisabledMouse = false;
        this.removingMethod = false;
    }

    componentDidUpdate(prevProps, prevState){
        let {isHidden} = this.state;
        let operatorClassName = '';
        const curOperator = this.props.operator;
        if(curOperator.isToggled){
            operatorClassName = styles.item_toggle_out;
            isHidden = true;
        } else{
            operatorClassName = styles.item_toggle_in;
            isHidden = false;
        }
        if(operatorClassName !== prevState.operatorClassName) {
            this.setState({
                operatorClassName,
            });
        }
        if(isHidden !== prevState.isHidden){
            let that = this;
            setTimeout(() => that.setState({isHidden}), 500);
        }
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

    updateEntity(){
        const {operator, updateEntity} = this.props;
        operator.deleteError();
        updateEntity();
    }

    isCurrentItem(){
        const {connector, operator} = this.props;
        return connector.getCurrentItem() && operator ? connector.getCurrentItem().index === operator.index : false;
    }

    toggleItem(){
        const {isToggled} = this.state;
        const {connector, operator, updateEntity} = this.props;
        connector.toggleByItem(operator, !isToggled);
        connector.setCurrentItem(operator);
        updateEntity();
        this.setState({isToggled: !isToggled});
    }

    renderOperatorType(){
        const {isVisibleMenuEdit} = this.state;
        const {connection, connector, operator, readOnly} = this.props;
          switch (operator.type){
            case IF_OPERATOR:
                return <IfOperator
                    tooltip={'if'}
                    readOnly={readOnly}
                    connection={connection}
                    connector={connector}
                    operator={operator}
                    updateEntity={::this.updateEntity}
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
                    updateEntity={::this.updateEntity}
                    isVisibleMenuEdit={isVisibleMenuEdit}
                    toggleIsVisibleMenuEdit={::this.toggleIsVisibleMenuEdit}
                    renderCloseMenuEditButton={::this.renderCloseMenuEditButton}
                />;
        }
        return null;
    }

    renderDeleteIcon(){
        const {hasDeleteButton, isVisibleMenuEdit} = this.state;
        if((!hasDeleteButton && !::this.isCurrentItem()) || isVisibleMenuEdit){
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

    renderToggleIcon(){
        const {hasDeleteButton, isVisibleMenuEdit} = this.state;
        const {operator} = this.props;
        const value = operator.isMinimized ? 'vertical_align_bottom' : 'vertical_align_top';
        const tooltip = operator.isMinimized ? 'Maximize' : 'Minimize';
        if((!hasDeleteButton && !::this.isCurrentItem()) || isVisibleMenuEdit){
            return null;
        }
        return(
            <TooltipFontIcon value={value} tooltip={tooltip} className={styles.toggle_icon} onClick={::this.toggleItem}/>
        );
    }

    renderMoreIcon(){
        const {operator} = this.props;
        if(!operator.isMinimized){
            return null;
        }
        return(
            <TooltipFontIcon value={'more_horiz'} tooltip={'Maximize'} className={styles.more_icon} onClick={::this.toggleItem}/>
        );
    }

    render(){
        const {operatorClassName, isHidden} = this.state;
        const {connector, operator} = this.props;
        let togglePanelStyles = {};
        togglePanelStyles.marginLeft = `${operator.getDepth() * 20}px`;
        if(operator.isMinimized) {
            togglePanelStyles.height = '15px';
            togglePanelStyles.marginTop = '10px';
            togglePanelStyles.marginBottom = '10px';
        }
        if(isHidden){
            return null;
        }
        if(operator.isToggled){
            return null;
        }
        return (
            <div
                id={`${operator.index}__${connector.getConnectorType()}`}
                className={`${styles.operator} ${operatorClassName}`}
                onMouseEnter={::this.showDeleteButton}
                onMouseLeave={::this.hideDeleteButton}
            >
                {this.renderOperatorType()}
                {this.renderDeleteIcon()}
                <div className={styles.toggle_panel} style={togglePanelStyles}>
                    {this.renderToggleIcon()}
                    {this.renderMoreIcon()}
                </div>
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