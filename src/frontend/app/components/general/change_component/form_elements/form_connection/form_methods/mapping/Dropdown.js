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

import {Row, Col} from "react-grid-system";
import {RadioGroup, RadioButton} from 'react-toolbox/lib/radio';
import {cloneObject} from "../../../../../../../utils/app";

import changeStyles from '../../../../../../../themes/default/general/change_component.scss';
import styles from '../../../../../../../themes/default/general/form_methods.scss';
import {isString} from "../../../../../../../utils/app";
import {markFieldNameAsArray} from "../utils";
import SelectSearch from "../../../../../basic_components/inputs/SelectSearch";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import {
    CONNECTOR_FROM,
    INSIDE_ITEM,
    OUTSIDE_ITEM
} from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CBindingItem from "../../../../../../../classes/components/content/connection/field_binding/CBindingItem";
import {STATEMENT_RESPONSE} from "../../../../../../../classes/components/content/connection/operator/CStatement";
import {RESPONSE_SUCCESS, RESPONSE_FAIL} from "../../../../../../../classes/components/content/invoker/response/CResponse";

const PARAM_DELIMITER = '.';


/**
 * Dropdown Component for Mapping
 */
class Dropdown extends Component{

    constructor(props){
        super(props);

        this.state = {
            inputValue: '',
            responseType: RESPONSE_SUCCESS,
            currentItem: null,
        };
    }

    static getDerivedStateFromProps(props, state){
        if(props.connection.fromConnector.getCurrentItem()){
            let currentItem = props.connection.fromConnector.getCurrentItem();
            if(!state.currentItem){
                return{
                    currentItem,
                };
            }
            if(currentItem.index !== state.currentItem.index) {
                return {
                    inputValue: '',
                    currentItem: currentItem,
                };
            }
        }
        return null;
    }

    /**
     * on change input value
     */
    onInputChange(inputValue){
        this.setState({
            inputValue,
        });
    }

    /**
     * to change responseType
     */
    onChangeResponseType(responseType){
        this.setState({
            responseType,
        });
    }

    /**
     * to select param from fromConnector
     */
    selectFromParam(){
        const {inputValue, responseType} = this.state;
        const {connection, updateEntity} = this.props;
        let currentItem = connection.fromConnector.getCurrentItem();
        let fieldName = inputValue;
        switch(responseType){
            case RESPONSE_SUCCESS:
                fieldName = currentItem.response.success.convertFieldNameForBackend(inputValue);
                break;
            case RESPONSE_FAIL:
                fieldName = currentItem.response.fail.convertFieldNameForBackend(inputValue);
                break;
        }
        let field = {};
        field.color = currentItem.color;
        field.field = `${responseType}.${fieldName}`;
        field.type = STATEMENT_RESPONSE;
        let bindingItem = CBindingItem.createBindingItem(field);
        connection.updateFieldBinding(CONNECTOR_FROM, bindingItem);
        this.setState({
            inputValue: '',
        }, updateEntity);

    }

    /**
     * to get menu source for select
     */
    getMenuSource(){
        const {responseType} = this.state;
        const {connection} = this.props;
        let menuSource = [];
        let currentItem = connection.fromConnector.getCurrentItem();
        if(currentItem) {
            if (currentItem.response) {
                switch(responseType){
                    case RESPONSE_SUCCESS:
                        menuSource = currentItem.response.success;
                        break;
                    case RESPONSE_FAIL:
                        menuSource = currentItem.response.fail;
                        break;
                }

            }
        }
        return menuSource;
    }

    renderResponseTypeGroup(){
        const {responseType} = this.state;
        return (
            <RadioGroup
                name='response_type'
                value={responseType}
                onChange={::this.onChangeResponseType}
                className={styles.method_response_radio_area}
            >
                <RadioButton label='s' value={RESPONSE_SUCCESS}
                             theme={{field: styles.method_radio_field, radio: styles.method_radio_radio, radioChecked: styles.method_radio_radio_checked, text: styles.method_radio_text}}/>
                <RadioButton label='f' value={RESPONSE_FAIL}
                             theme={{field: styles.method_radio_field, radio: styles.method_radio_radio, radioChecked: styles.method_radio_radio_checked, text: styles.method_radio_text}}/>
            </RadioGroup>
        );
    }

    render(){
        const {inputValue} = this.state;
        const {readOnly} = this.props;
        return (
            <Row>
                <Col md={5} className={`${changeStyles.form_select_method}`}>
                    {this.renderResponseTypeGroup()}
                    <div className={styles.dropdown_menu_menu}>
                        <SelectSearch
                            id={'left_connector_add_param'}
                            placeholder={'param'}
                            items={this.getMenuSource()}
                            readOnly={readOnly}
                            doAction={::this.selectFromParam}
                            onInputChange={::this.onInputChange}
                            inputValue={inputValue}
                            icon={'search'}
                        />
                    </div>
                </Col>
            </Row>
        );
    }
}

Dropdown.propTypes = {
    readOnly: PropTypes.bool,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    updateEntity: PropTypes.func.isRequired,
};

Dropdown.defaultProps = {
    readOnly: false,
};

export default Dropdown;