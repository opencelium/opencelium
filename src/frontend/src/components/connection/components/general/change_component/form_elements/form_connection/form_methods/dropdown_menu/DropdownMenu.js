

/*
 * Copyright (C) <2022>  <becon GmbH>
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
import {connect} from 'react-redux';
import styles from '@themes/default/general/form_methods.scss';
import ItemsMenu from "./ItemsMenu";
import Button from "@basic_components/buttons/Button";
import Dropdown from "./Dropdown";
import CConnection from "@classes/components/content/connection/CConnection";
import CConnectorItem, {
    CONNECTOR_DEPTH_LIMIT,
    CONNECTOR_FROM, CONNECTOR_TO,
    INSIDE_ITEM, METHOD_ITEM, OPERATOR_ITEM,
    OUTSIDE_ITEM
} from "@classes/components/content/connection/CConnectorItem";
import {
    IF_OPERATOR,
    LOOP_OPERATOR
} from "@classes/components/content/connection/operator/COperatorItem";
import FontIcon from "@basic_components/FontIcon";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import Select from "@basic_components/inputs/Select";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}

/**
 * Dropdown Menu Component
 */@connect(mapStateToProps, {})
class DropdownMenu extends Component{

    constructor(props){
        super(props);
        this.state = {
            dropdownValue: null,
            itemType: METHOD_ITEM,
            methodType: OUTSIDE_ITEM,
            showDropdown: false,
        };
    }

    /**
     * to show/hide dropdown
     */
    toggleDropdown(){
        this.setState({showDropdown: !this.state.showDropdown});
    }

    /**
     * to get response data from invoker
     */
    getInvokerResponse(){
        const {connector} = this.props;
        if(connector.invoker) {
            return connector.invoker.operations.map(operation => {
                return {label: operation.name, value: operation.name};
            });
        }
        return [];
    }

    /**
     * to change dropdown value
     */
    onChange(value){
        this.setState({
            dropdownValue: value,
            methodType: OUTSIDE_ITEM,
        });
    }

    /**
     * to change methodType
     */
    onChangeMethodType(methodType){
        this.setState({
            methodType,
        });
    }

    /**
     * to change itemType
     */
    onSelectItemType(itemType){
        this.setState({
            itemType,
            dropdownValue: null,
            methodType: OUTSIDE_ITEM,
        });
    }

    /**
     * to add item
     */
    onAdd(){
        const {connection, connector, updateEntity} = this.props;
        let {dropdownValue, itemType, methodType} = this.state;
        let item = {};
        if(dropdownValue !== null) {
            let operation = connector.invoker.operations.find(o => o.name === dropdownValue.value);
            switch (itemType) {
                case METHOD_ITEM:
                    item.name = dropdownValue.value;
                    item.request = operation.request.getObject({bodyOnlyConvert: true});
                    item.response = operation.response.getObject({bodyOnlyConvert: true});
                    switch (connector.getConnectorType()) {
                        case CONNECTOR_FROM:
                            connection.addFromConnectorMethod(item, methodType);
                            break;
                        case CONNECTOR_TO:
                            connection.addToConnectorMethod(item, methodType);
                            break;
                    }
                    break;
                case OPERATOR_ITEM:
                    item.type = dropdownValue.value;
                    connector.addOperator(item, methodType);
                    break;
            }
            updateEntity();
            let newState = {
                methodType: OUTSIDE_ITEM,
            };
            let currentItem = connector.getCurrentItem();
            if(currentItem){
                let depth = connector.getCurrentItem().getDepth();
                if(depth >= CONNECTOR_DEPTH_LIMIT){
                    newState.itemType = METHOD_ITEM;
                    newState.dropdownValue = null;
                }
            }
            this.setState(newState);
        }
    }


    /**
     * to get values for dropdown
     */
    getDropdownSource(){
        const {connector} = this.props;
        const {itemType} = this.state;
        let data = [];
        let placeholderLabel = 'choose method';
        if(connector.getConnectorType() === CONNECTOR_FROM && connector.getCurrentItem() === null && itemType !== METHOD_ITEM){
            this.onSelectItemType(METHOD_ITEM);
        } else {
            switch (itemType) {
                case METHOD_ITEM:
                    data = this.getInvokerResponse();
                    break;
                case OPERATOR_ITEM:
                    placeholderLabel = 'choose operator';
                    data = [{label: 'if', value: IF_OPERATOR}, {label: 'loop', value: LOOP_OPERATOR}];
                    break;
            }
        }
        return data;
    }

    renderMethodRadio(isOperator){
        if(isOperator) {
            return(
                <RadioButtons
                    hasToolboxTheme={false}
                    label={''}
                    value={this.state.methodType}
                    handleChange={(a) => this.onChangeMethodType(a)}
                    name='method_type'
                    className={styles.dropdown_menu_radios}
                    radios={[
                        {
                            label: 'in',
                            value: INSIDE_ITEM,
                            inputClassName: styles.radio_in,
                            labelClassName: styles.label_in,
                        },
                        {
                            label: 'out',
                            value: OUTSIDE_ITEM,
                            inputClassName: styles.radio_out,
                            labelClassName: styles.label_out,
                        },
                    ]}
                />
            );
        }
        return null;
    }

    renderDropdown(isOperator){
        const {connector} = this.props;
        const {dropdownValue, itemType} = this.state;
        const connectorType = connector.getConnectorType();
        let source = this.getDropdownSource();
        let name = itemType === METHOD_ITEM ? 'Select method' : 'Select operator';
        let inputStyle = {float: 'left', width: '80%'};
        if(isOperator){
            inputStyle = {float: 'left', width: '70%'};
        }
        return (
            <div style={inputStyle}>
                <Select
                    id={`items_menu_${connectorType}`}
                    name={name}
                    value={dropdownValue}
                    onChange={(a) => this.onChange(a)}
                    options={source}
                    closeOnSelect={false}
                    placeholder={name}
                    maxMenuHeight={200}
                    minMenuHeight={50}
                    label={name}
                />
            </div>
        );
    }

    render(){
        const {itemType, showDropdown} = this.state;
        const {connector, authUser} = this.props;
        let currentItem = connector.getCurrentItem();
        let connectorType = connector.getConnectorType();
        let dropdownMenuStyles = {};
        let isOperator = false;
        let inputMethodAddStyle = {width: '20%'};
        let dropdownMenuMenuStyle = {};
        let inputMethodAddIconClassName = styles.input_method_add_icon;
        if(connector.methods.length > 0 || connector.operators.length > 0){
            dropdownMenuStyles.marginTop = '50px';
        }
        if(currentItem && currentItem.type){
            isOperator = true;
        }
        if(isOperator){
            inputMethodAddStyle.width = '30%';
            dropdownMenuMenuStyle.width = '100%';
            inputMethodAddIconClassName = styles.input_method_add_icon_for_operator;
        }

        return (
            <div style={dropdownMenuStyles}>
                <div style={{textAlign: 'center', marginBottom: '15px', marginTop: '15px'}}>
                    <Button authUser={authUser} className={styles.add_button} size={32} icon={showDropdown ? 'remove' : 'add'} onClick={(a) => this.toggleDropdown(a)} id={`add_item_${connectorType}`}/>
                </div>
                <Dropdown showDropdown={showDropdown}>
                    <ItemsMenu
                        onSelectItemType={(a) => this.onSelectItemType(a)}
                        itemType={itemType}
                        connector={connector}
                    />
                    <div className={styles.dropdown_menu_menu} style={dropdownMenuMenuStyle}>
                        {this.renderDropdown(isOperator)}
                        <div className={`${styles.input_method_add}`} style={inputMethodAddStyle}>
                            {this.renderMethodRadio(isOperator)}
                            <TooltipFontIcon tooltip={'Create'} className={inputMethodAddIconClassName} value={'check_circle_outline'} onClick={(a) => this.onAdd(a)} isButton={true}/>
                        </div>
                    </div>
                </Dropdown>
            </div>
        );
    }
}

DropdownMenu.propTypes = {
    connection: PropTypes.instanceOf(CConnection),
    connector: PropTypes.instanceOf(CConnectorItem),
    updateEntity: PropTypes.func.isRequired,
};

export default DropdownMenu;