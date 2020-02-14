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
import Select from 'react-select';
import {RadioGroup, RadioButton} from 'react-toolbox/lib/radio';

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../../../../themes/default/general/form_methods.scss';
import {dotColor} from "../utils";
import {CONNECTOR_FROM, CONNECTOR_TO} from "../../../../../../../classes/components/content/connection/CConnectorItem";
import {
    DEFAULT_COLOR,
} from "../../../../../../../classes/components/content/connection/operator/CStatement";
import TooltipFontIcon from "../../../../../basic_components/tooltips/TooltipFontIcon";
import COperatorItem from "../../../../../../../classes/components/content/connection/operator/COperatorItem";
import CConnectorItem from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import SelectSearch from "../../../../../basic_components/inputs/SelectSearch";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "../../../../../../../classes/components/content/invoker/response/CResponse";
import Input from "../../../../../basic_components/inputs/Input";


/**
 * PointerGenerator Component
 */
class PointerGenerator extends Component{

    constructor(props){
        super(props);
        let {field} = props.operator.condition.leftStatement;
        this.state = {
            field,
            responseType: RESPONSE_SUCCESS,
        };
    }

    /**
     * to change field
     */
    updateField(){
        const {field} = this.state;
        const {operator, updateEntity} = this.props;
        operator.setLeftStatementField(field);
        operator.setLeftStatementParent(this.getParamSource());
        updateEntity();
    }

    /**
     * to change field value
     */
    onChangeField(field){
        const {operator, updateEntity} = this.props;
        this.setState({field});
        /*operator.setLeftStatementField(field);
        operator.setLeftStatementParent(this.getParamSource());
        updateEntity();*/
    }

    /**
     * to change responseType
     */
    onChangeResponseType(responseType){
        const {operator, updateEntity} = this.props;
        this.setState({
            responseType,
            field: '',
        });
        operator.setLeftStatementResponseType(responseType);
        operator.setLeftStatementField('');
        operator.setLeftStatementParent(null);
        updateEntity();
    }

    /**
     * to get options for methods select
     */
    getOptionsForMethods(){
        let {connection, connector, operator} = this.props;
        return connection.getOptionsForMethods(connector, operator, {isKeyConsidered: false});
    }

    /**
     * to change color
     */
    updateColor(method){
        const {operator, updateEntity} = this.props;
        operator.setLeftStatementColor(method.color);
        updateEntity();
        this.setState({
            field: '',
            responseType: RESPONSE_SUCCESS,
        });
    }

    setCurrentItem(){
        const {connector, updateEntity, operator} = this.props;
        connector.setCurrentItem(operator);
        updateEntity();
    }

    getParamSource(){
        const {responseType} = this.state;
        const {connection, operator} = this.props;
        let methodColor = operator.condition.leftStatement.color;
        let method = connection.getConnectorMethodByColor(methodColor);
        let paramSource = null;
        if(method) {
            switch (responseType) {
                case RESPONSE_SUCCESS:
                    paramSource = method.response.success;
                    break;
                case RESPONSE_FAIL:
                    paramSource = method.response.fail;
                    break;
            }
        }
        return paramSource;
    }

    renderMethodSelect(){
        const {connection, operator, readOnly} = this.props;
        let indexSplitted = operator.index.split('_');
        let pointerWidthValue = indexSplitted.length > 0 ? 260 - ((indexSplitted.length - 1) * 20) + 'px' : '260px';
        let myStyles = {width: pointerWidthValue, paddingLeft: styles.paddingLeft ? styles.paddingLeft : 0};
        let statement = operator.condition.leftStatement;
        let method = connection.toConnector.getMethodByColor(statement.color);
        let connector = connection.toConnector;
        if(!method){
            method = connection.fromConnector.getMethodByColor(statement.color);
            connector = connection.fromConnector;
        }
        let value = method ? method.getValueForSelectInput(connector) : null;
        let selectThemeInputStyle = {width: '30%', float: 'left'};
        let generalStyles = {width: '95%', float: 'right'};
        let source = this.getOptionsForMethods();
        generalStyles.width = myStyles.width;
        selectThemeInputStyle.padding = 0;
        return (
            <div className={`${theme.input}`} style={selectThemeInputStyle}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <Select
                    name={'method'}
                    value={value}
                    onChange={::this.updateColor}
                    options={source.length > 0 ? source : [{label: 'No params', value: 0, color: 'white'}]}
                    closeOnSelect={false}
                    placeholder={'...'}
                    isDisabled={readOnly}
                    isSearchable={!readOnly}
                    openMenuOnClick={true}
                    maxMenuHeight={200}
                    minMenuHeight={50}
                    styles={{
                        container: (provided, {isFocused, isDisabled}) => ({
                            fontSize: '12px',
                            borderBottom: isFocused && !isDisabled ? '2px solid #3f51b5 !important' : 'none',
                        }),
                        control: styles => ({
                            ...styles,
                            borderRadius: 0,
                            border: 'none',
                            borderBottom: '1px solid rgba(33, 33, 33, 0.12)',
                            boxShadow: 'none',
                            backgroundColor: 'initial'
                        }),
                        dropdownIndicator: () => ({display: 'none'}),
                        menu: (styles, {isDisabled}) => {
                            let s = {
                                ...styles,
                                top: 'auto',
                                marginTop: '-16px',
                                marginBottom: '8px',
                                width: '150px',
                                zIndex: '1',
                            };
                            if(isDisabled || source.length === 0){
                                s = {
                                    ...styles,
                                    display: 'none'
                                };
                            }
                            return s;
                        },
                        option: (styles, {data, isDisabled,}) => {
                            return {
                                ...styles,
                                ...dotColor(data.color),
                                cursor: isDisabled ? 'not-allowed' : 'default',
                            };
                        },
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                color: data.color,
                                background: data.color,
                                width: '65%'
                            };
                        }
                    }}
                />
                <span className={theme.bar}/>
            </div>
        );
    }

    renderResponseTypeGroup(){
        const {responseType} = this.state;
        const {operator} = this.props;
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        return (
            <RadioGroup
                name='response_type'
                value={responseType}
                onChange={::this.onChangeResponseType}
                className={styles.operator_response_radio_area}
                disabled={!hasMethod}
            >
                <RadioButton label='s' value={RESPONSE_SUCCESS}
                             theme={{field: styles.operator_radio_field, radio: styles.operator_radio_radio, disabled: styles.operator_radio_field_disabled, radioChecked: styles.operator_radio_radio_checked, text: styles.operator_radio_text}}/>
                <RadioButton label='f' value={RESPONSE_FAIL}
                             theme={{field: `${styles.operator_radio_field} ${styles.operator_radio_field_fail}`, radio: styles.operator_radio_radio, disabled: styles.operator_radio_field_disabled, radioChecked: styles.operator_radio_radio_checked, text: styles.operator_radio_text}}/>
            </RadioGroup>
        );
    }

    renderParamInput(){
        let {field, readOnly} = this.state;
        const {operator} = this.props;
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        let inputTheme = {};
        let divStyles = {float: 'left', width: '70%'};
        inputTheme.input = styles.input_pointer_param;
        return (
            <div style={divStyles}>
                {::this.renderResponseTypeGroup()}

                <Input
                    placeholder={'param'}
                    type={'text'}
                    value={field}
                    onChange={::this.onChangeField}
                    onBlur={::this.updateField}
                    readOnly={readOnly || !hasMethod}
                    theme={inputTheme}
                    isPopupInput={true}
                >
                    <SelectSearch
                        id={`loop_operator_${operator.type}_${operator.index}`}
                        className={styles.operator_left_field}
                        placeholder={'param'}
                        items={hasMethod ? this.getParamSource() : []}
                        readOnly={readOnly || !hasMethod}
                        doAction={::this.onChangeField}
                        onInputChange={::this.onChangeField}
                        inputValue={field}
                    />
                </Input>
            </div>
        );
    }

    render(){
        const {connector, tooltip, operator, getStyles} = this.props;
        let classNames = styles.operator_icon;
        let operatorStyles = getStyles();
        let isCurrentItem = connector.getCurrentItem().index === operator.index;
        if(isCurrentItem){
            classNames += ` ${styles.selected_item}`;
        }
        return (
            <div style={operatorStyles}>
                <div style={{float: 'left', width: '10%'}}>
                    <TooltipFontIcon
                        className={classNames}
                        tooltip={tooltip}
                        value={'loop'}
                        onClick={::this.setCurrentItem}
                        tooltipPosition={'top'}
                    />
                </div>
                <div style={{width: '90%', float: 'right'}} onClick={::this.setCurrentItem}>
                    {this.renderMethodSelect()}
                    {this.renderParamInput()}
                </div>
            </div>

        );
    }
}

PointerGenerator.propTypes = {
    tooltip: PropTypes.string,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    operator: PropTypes.instanceOf(COperatorItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
    styles: PropTypes.object,
};

PointerGenerator.defaultProps = {
    styles: {},
    tooltip: '',
};

export default PointerGenerator;