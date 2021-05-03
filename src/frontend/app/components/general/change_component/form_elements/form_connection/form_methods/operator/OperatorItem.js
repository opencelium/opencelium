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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from '@themes/default/general/form_methods.scss';

import DeleteIcon from "./DeleteIcon";
import CConnectorItem, {
    CONNECTOR_FROM,
    CONNECTOR_TO
} from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import COperatorItem, {
    IF_OPERATOR,
    LOOP_OPERATOR
} from "@classes/components/content/connection/operator/COperatorItem";
import IfOperator from "./IfOperator";
import LoopOperator from "./LoopOperator";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


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
            deletingOperator: false,
        };
        this.isDisabledMouse = false;
    }

    componentDidUpdate(prevProps, prevState){
        let {isHidden, deletingOperator} = this.state;
        let operatorClassName = '';
        const curOperator = this.props.operator;
        if(deletingOperator && this.state.operatorClassName !== styles.item_toggle_out){
            operatorClassName = styles.item_toggle_out;
            this.setState({
                operatorClassName,
            });
            return;
        }
        if(curOperator.isToggled){
            operatorClassName = styles.item_toggle_out;
            isHidden = true;
        } else{
            operatorClassName = styles.item_toggle_in;
            isHidden = false;
        }
        if(operatorClassName !== prevState.operatorClassName) {
            if(isHidden !== prevState.isHidden){
                this.setState({
                    //operatorClassName,
                    isHidden,
                });
            }
        }
        if(isHidden !== prevState.isHidden){
            let that = this;
            setTimeout(() => that.setState({isHidden}), 300);
        }
    }

    toggleDeleteOperator(){
        const {isToggled} = this.state;
        const {connector, operator, updateEntity} = this.props;
        connector.toggleByItem(operator, !isToggled);
        updateEntity();
        this.setState({
            deletingOperator: !this.state.deletingOperator,
        });
    }

    /**
     * to toggle isVisibleMenuEdit
     */
    toggleIsVisibleMenuEdit(){
        this.setCurrentItem();
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
                    intend={`${operator.intend * 20}px`}
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
                    intend={`${operator.intend * 20}px`}
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
                toggleDeleteOperator={::this.toggleDeleteOperator}
                removeOperator={::this.removeOperator}
                disableMouseForOperator={::this.toggleDisableMouse}
            />
        );
    }

    renderCloseMenuEditButton(){
        return (
            <TooltipFontIcon
                size={16}
                isButton={true}
                className={styles.operator_close_menu_edit}
                value={'check_circle_outline'}
                tooltip={'Apply'}
                onClick={::this.toggleIsVisibleMenuEdit}
            />
        );
    }

    renderTogglePanel(){
        const {deletingOperator} = this.state;
        const {connector, operator} = this.props;
        let hasChildren = connector.hasItemChildren(operator);
        if(!hasChildren){
            return null;
        }
        let togglePanelStyles = {};
        const intend = `${operator.intend * 20}px`;
        togglePanelStyles.marginLeft = intend;
        if(operator.isMinimized && !deletingOperator) {
            togglePanelStyles.left = `calc(50% - ${intend})`;
            togglePanelStyles.bottom = '-26px';
        }
        return(
            <div className={styles.toggle_panel} style={togglePanelStyles}>
                {this.renderToggleIcon()}
                {this.renderMoreIcon()}
            </div>
        );
    }

    renderToggleIcon(){
        const {hasDeleteButton, isVisibleMenuEdit} = this.state;
        const {operator} = this.props;
        if((!hasDeleteButton && !::this.isCurrentItem()) || isVisibleMenuEdit || operator.isMinimized){
            return null;
        }
        let value = 'vertical_align_top';
        let tooltip = 'Minimize';
        let fontIconStyles = {};
        return(
            <TooltipFontIcon value={value} tooltip={tooltip} className={styles.toggle_icon} style={fontIconStyles} onClick={::this.toggleItem}/>
        );
    }

    renderMoreIcon(){
        const {deletingOperator} = this.state;
        const {operator} = this.props;
        if(!operator.isMinimized || deletingOperator){
            return null;
        }
        return(
            <TooltipFontIcon value={'more_horiz'} tooltip={'Maximize'} className={styles.more_icon} onClick={::this.toggleItem}/>
        );
    }

    render(){
        const {operatorClassName, isHidden} = this.state;
        const {connector, operator, index} = this.props;
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
                style={{zIndex: 99 - index, textAlign: 'left'}}
                onMouseEnter={::this.showDeleteButton}
                onMouseLeave={::this.hideDeleteButton}
            >
                {this.renderOperatorType()}
                {this.renderDeleteIcon()}
                {this.renderTogglePanel()}
            </div>
        );
    }
}

OperatorItem.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem),
    method: PropTypes.instanceOf(COperatorItem),
    updateEntity: PropTypes.func.isRequired,
    firstItemIndex: PropTypes.string,
};

OperatorItem.defaultProps = {
    firstItemIndex: '0',
};

export default OperatorItem;