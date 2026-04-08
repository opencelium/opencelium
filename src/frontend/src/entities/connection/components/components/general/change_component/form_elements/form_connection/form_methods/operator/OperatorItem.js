/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';

import DeleteIcon from "./DeleteIcon";
import CConnectorItem, {
    CONNECTOR_FROM,
    CONNECTOR_TO
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import COperatorItem, {
    IF_OPERATOR,
    LOOP_OPERATOR
} from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import IfOperator from "./IfOperator";
import LoopOperator from "./LoopOperator";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";

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
        this.hideTimeout = null;

        this.handleUpdateEntity = this.updateEntity.bind(this);
        this.handleToggleDeleteOperator = this.toggleDeleteOperator.bind(this);
        this.handleToggleIsVisibleMenuEdit = this.toggleIsVisibleMenuEdit.bind(this);
        this.handleToggleItem = this.toggleItem.bind(this);
        this.handleShowDeleteButton = this.showDeleteButton.bind(this);
        this.handleHideDeleteButton = this.hideDeleteButton.bind(this);
        this.handleSetCurrentItem = this.setCurrentItem.bind(this);
        this.handleRemoveOperator = this.removeOperator.bind(this);
        this.handleToggleDisableMouse = this.toggleDisableMouse.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        return (
            nextProps.connection !== this.props.connection ||
            nextProps.connector !== this.props.connector ||
            nextProps.operator !== this.props.operator ||
            nextProps.readOnly !== this.props.readOnly ||
            nextProps.index !== this.props.index ||
            nextState.hasDeleteButton !== this.state.hasDeleteButton ||
            nextState.isVisibleMenuEdit !== this.state.isVisibleMenuEdit ||
            nextState.isToggled !== this.state.isToggled ||
            nextState.operatorClassName !== this.state.operatorClassName ||
            nextState.isHidden !== this.state.isHidden ||
            nextState.deletingOperator !== this.state.deletingOperator
        );
    }

    componentDidUpdate(prevProps, prevState){
        const curOperator = this.props.operator;
        const nextState = {};

        if (this.state.deletingOperator) {
            if (this.state.operatorClassName !== styles.item_toggle_out) {
                nextState.operatorClassName = styles.item_toggle_out;
            }
        } else {
            const nextOperatorClassName = curOperator.isToggled
                ? styles.item_toggle_out
                : styles.item_toggle_in;
            const nextIsHidden = !!curOperator.isToggled;

            if (nextOperatorClassName !== this.state.operatorClassName) {
                nextState.operatorClassName = nextOperatorClassName;
            }

            if (nextIsHidden !== this.state.isHidden) {
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                    this.hideTimeout = null;
                }

                this.hideTimeout = setTimeout(() => {
                    this.setState({isHidden: nextIsHidden});
                    this.hideTimeout = null;
                }, 300);
            }
        }

        if (Object.keys(nextState).length > 0) {
            this.setState(nextState);
        }
    }

    componentWillUnmount() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    toggleDeleteOperator(){
        const {isToggled} = this.state;
        const {connector, operator, updateEntity} = this.props;

        connector.toggleByItem(operator, !isToggled);
        updateEntity();

        this.setState((prevState) => ({
            deletingOperator: !prevState.deletingOperator,
        }));
    }

    /**
     * to toggle isVisibleMenuEdit
     */
    toggleIsVisibleMenuEdit(){
        this.setCurrentItem();
        this.setState((prevState) => ({
            isVisibleMenuEdit: !prevState.isVisibleMenuEdit,
        }));
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
        if(!this.isDisabledMouse && !readOnly && !this.state.hasDeleteButton) {
            this.setState({
                hasDeleteButton: true,
            });
        }
    }

    /**
     * to hide delete button
     */
    hideDeleteButton(){
        if(!this.isDisabledMouse && this.state.hasDeleteButton) {
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
        const connectorType = connector.getConnectorType();

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
        const currentItem = connector.getCurrentItem();
        return currentItem && operator ? currentItem.index === operator.index : false;
    }

    toggleItem(){
        const {isToggled} = this.state;
        const {connector, operator, updateEntity} = this.props;

        connector.toggleByItem(operator, !isToggled);
        connector.setCurrentItem(operator);
        updateEntity();

        this.setState((prevState) => ({
            isToggled: !prevState.isToggled,
        }));
    }

    renderOperatorType(){
        const {isVisibleMenuEdit} = this.state;
        const {connection, connector, operator, readOnly} = this.props;
        const intend = `${operator.intend * 20}px`;

        switch (operator.type){
            case IF_OPERATOR:
                return (
                    <IfOperator
                        tooltip={'if'}
                        readOnly={readOnly}
                        connection={connection}
                        connector={connector}
                        operator={operator}
                        updateEntity={this.handleUpdateEntity}
                        isVisibleMenuEdit={isVisibleMenuEdit}
                        toggleIsVisibleMenuEdit={this.handleToggleIsVisibleMenuEdit}
                        renderCloseMenuEditButton={this.renderCloseMenuEditButton.bind(this)}
                        intend={intend}
                    />
                );

            case LOOP_OPERATOR:
                return (
                    <LoopOperator
                        tooltip={'loop'}
                        readOnly={readOnly}
                        connection={connection}
                        connector={connector}
                        operator={operator}
                        updateEntity={this.handleUpdateEntity}
                        isVisibleMenuEdit={isVisibleMenuEdit}
                        toggleIsVisibleMenuEdit={this.handleToggleIsVisibleMenuEdit}
                        renderCloseMenuEditButton={this.renderCloseMenuEditButton.bind(this)}
                        intend={intend}
                    />
                );

            default:
                return null;
        }
    }

    renderDeleteIcon(){
        const {hasDeleteButton, isVisibleMenuEdit} = this.state;

        if((!hasDeleteButton && !this.isCurrentItem()) || isVisibleMenuEdit){
            return null;
        }

        return(
            <DeleteIcon
                toggleDeleteOperator={this.handleToggleDeleteOperator}
                removeOperator={this.handleRemoveOperator}
                disableMouseForOperator={this.handleToggleDisableMouse}
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
                onClick={this.handleToggleIsVisibleMenuEdit}
            />
        );
    }

    renderTogglePanel(){
        const {deletingOperator} = this.state;
        const {connector, operator} = this.props;
        const hasChildren = connector.hasItemChildren(operator);

        if(!hasChildren){
            return null;
        }

        const intend = `${operator.intend * 20}px`;
        const togglePanelStyles = {
            marginLeft: intend,
        };

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

        if((!hasDeleteButton && !this.isCurrentItem()) || isVisibleMenuEdit || operator.isMinimized){
            return null;
        }

        return(
            <TooltipFontIcon
                value={'vertical_align_top'}
                tooltip={'Minimize'}
                className={styles.toggle_icon}
                style={{}}
                onClick={this.handleToggleItem}
            />
        );
    }

    renderMoreIcon(){
        const {deletingOperator} = this.state;
        const {operator} = this.props;

        if(!operator.isMinimized || deletingOperator){
            return null;
        }

        return(
            <TooltipFontIcon
                value={'more_horiz'}
                tooltip={'Maximize'}
                className={styles.more_icon}
                onClick={this.handleToggleItem}
            />
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
                onMouseEnter={this.handleShowDeleteButton}
                onMouseLeave={this.handleHideDeleteButton}
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