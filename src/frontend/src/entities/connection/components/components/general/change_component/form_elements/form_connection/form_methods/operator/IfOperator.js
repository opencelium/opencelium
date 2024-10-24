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
import Input from '@entity/connection/components/components/general/basic_components/inputs/Input';

import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import {DEFAULT_COLOR} from "@entity/connection/components/classes/components/content/connection/operator/CStatement";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import COperatorItem from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CCondition, {FUNCTIONAL_OPERATORS_FOR_IF} from "@entity/connection/components/classes/components/content/connection/operator/CCondition";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import SelectSearch from "@entity/connection/components/components/general/basic_components/inputs/SelectSearch";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "@entity/connection/components/classes/components/content/invoker/response/CResponse";
import RadioButtons from "@entity/connection/components/components/general/basic_components/inputs/RadioButtons";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";
import {
    LikePercentageStyled
} from "@change_component/form_elements/form_connection/form_svg/details/description/operator/condition/styles";


/**
 * IfOperator Component
 */
class IfOperator extends Component{

    constructor(props){
        super(props);
        let leftField = props.operator.condition.leftStatement.getFieldWithoutArrayBrackets();
        let rightProperty = props.operator.condition.rightStatement.getRightPropertyValueWithoutArrayBrackets();
        let rightField = props.operator.condition.rightStatement.getFieldWithoutArrayBrackets();
        this.state = {
            responseType: RESPONSE_SUCCESS,
            responseTypeRight: RESPONSE_SUCCESS,
            leftField,
            rightField,
            rightProperty,
            isMouseOverPlaceholder: false,
        };
    }

    /**
     * to toggle field isMouseOverPlaceholder
     */
    toggleIsMouseOverPlaceholder(){
        this.setState({isMouseOverPlaceholder: !this.state.isMouseOverPlaceholder});
    }

    /**
     * to change field
     */
    updateLeftField(){
        const {leftField} = this.state;
        const {operator, updateEntity} = this.props;
        operator.setLeftStatementField(leftField);
        operator.setLeftStatementParent(this.getParamSource('leftStatement'));
        updateEntity();
    }

    /**
     * to change field value
     */
    onChangeField(leftField){
        this.setState({leftField});
    }

    /**
     * to change responseType
     */
    onChangeResponseType(responseType){
        const {operator, updateEntity} = this.props;
        this.setState({
            responseType,
            leftField: '',
            rightProperty: '',
            rightField: '',
        });
        operator.setLeftStatementResponseType(responseType);
        operator.setLeftStatementField('');
        operator.setLeftStatementParent(null);
        updateEntity();
    }

    /**
     * to change responseType for right statement
     */
    onChangeResponseTypeRight(responseTypeRight){
        const {operator, updateEntity} = this.props;
        this.setState({
            responseTypeRight,
            rightField: '',
        });
        operator.setRightStatementResponseType(responseType);
        operator.setRightStatementField('');
        operator.setRightStatementParent(null);
        updateEntity();
    }

    /**
     * to change right field value
     */
    onChangeRightField(rightField, callback = () => {}){
        if(this.isLikeOperator()){
            if(rightField.length > 1){
                rightField = CCondition.embraceFieldForLikeOperator(rightField);
                if(rightField[0] === '%'){
                    rightField = `%${rightField}`;
                }
                if(rightField[rightField.length - 1] === '%'){
                    rightField += '%';
                }
            }
        }
        this.setState({rightField}, callback);
    }

    /**
     * to change right field value
     */
    onChangeRightProperty(rightProperty){
        this.setState({rightProperty});
    }

    getOperatorLabel(){
        const {operator} = this.props;
        let value = operator.condition.relationalOperator;
        let functionalOperator = FUNCTIONAL_OPERATORS_FOR_IF.find(o => o.value === value);
        if(functionalOperator && functionalOperator.hasOwnProperty('placeholderValue')){
            return functionalOperator.placeholderValue;
        }
        return value;
    }

    checkIfOperatorHasThreeParams(){
        const {operator} = this.props;
        let relationalOperatorValue = operator.condition.relationalOperator;
        let functionalOperator = FUNCTIONAL_OPERATORS_FOR_IF.find(o => o.value === relationalOperatorValue);
        if(functionalOperator && functionalOperator.hasOwnProperty('hasThreeValues')){
            return functionalOperator.hasThreeValues;
        }
        return false;
    }

    getParamSource(statement){
        const {responseType} = this.state;
        const {connection, operator} = this.props;
        let methodColor = operator.condition[statement].color;
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

    /**
     * to get options for methods select
     */
    getOptionsForMethods(statement){
        let {connection, connector, operator} = this.props;
        return connection.getOptionsForMethods(connector, operator, {statement, isKeyConsidered: false, exceptCurrent: false});
    }

    /**
     * to change color
     */
    updateColor(method){
        const {operator, updateEntity} = this.props;
        operator.setLeftStatementColor(method.color);
        updateEntity();
        this.setState({
            leftField: '',
            rightProperty: '',
            responseType: RESPONSE_SUCCESS,
        });
    }

    /**
     * to change color
     */
    updateColorRight(method){
        const {operator, updateEntity} = this.props;
        operator.setRightStatementColor(method.color);
        let rightField = '';
        if(operator.condition.relationalOperator && CCondition.isLikeOperator(operator.condition.relationalOperator)){
            rightField = CCondition.embraceFieldForLikeOperator('');
        }
        this.setState({
            rightField,
            rightProperty: '',
            responseTypeRight: RESPONSE_SUCCESS,
        });
        updateEntity();
    }

    /**
     * to change field
     */
    updateRelationalOperator(relationalOperator){
        const {operator, updateEntity} = this.props;
        operator.setRelationalOperator(relationalOperator.value);
        this.updateColorRight({color: ''});
        updateEntity();
    }

    /**
     * to change field
     */
    updateRightField(){
        const {rightField} = this.state;
        const {operator, updateEntity} = this.props;
        operator.setRightStatementField(rightField);
        operator.setRightStatementParent(this.getParamSource('rightStatement'));
        updateEntity();
    }


    /**
     * to select right field
     */
    selectRightField(rightField){
        this.onChangeRightField(rightField.value, (a) => this.updateRightField(a));
    }

    /**
     * to change field
     */
    updateRightPropertyValue(){
        const {rightProperty} = this.state;
        const {operator, updateEntity} = this.props;
        operator.setRightStatementRightPropertyValue(rightProperty);
        updateEntity();
    }

    setCurrentItem(){
        const {connector, updateEntity, operator} = this.props;
        connector.setCurrentItem(operator);
        updateEntity();
    }

    isOperatorHasValue(){
        let hasValue = false;
        let isRightStatementText = false;
        let isRightStatementOption = false;
        let isMultiline = false;
        let popupInputStyles = null;
        let options = [];
        const {operator} = this.props;
        let value = operator.condition.relationalOperator;
        let hasValueItem = FUNCTIONAL_OPERATORS_FOR_IF.find(fo => fo.value === value);
        if(hasValueItem){
            hasValue = hasValueItem.hasValue;
            isRightStatementText = hasValueItem.isRightStatementText;
            if(hasValueItem.hasOwnProperty('isRightStatementOption')) {
                isRightStatementOption = hasValueItem.isRightStatementOption;
            }
            if(hasValueItem.hasOwnProperty('isMultiline')){
                isMultiline = hasValueItem.isMultiline;
            }
            if(hasValueItem.hasOwnProperty('popupInputStyles')){
                popupInputStyles = hasValueItem.popupInputStyles;
            }
        }
        if(isRightStatementOption){
            if(hasValueItem.hasOwnProperty('options')) {
                options = hasValueItem.options;
            }
        }
        return {hasValue, isRightStatementText, isRightStatementOption, options, isMultiline, popupInputStyles} ;
    }

    renderPlaceholder(){
        let {rightField, rightProperty} = this.state;
        let {hasValue, isRightStatementOption, options} = this.isOperatorHasValue();
        if(isRightStatementOption){
            let index = options.findIndex(option => option.value === rightField);
            if(index !== -1){
                rightField = options[index].label;
            }
        }
        let title = this.state.leftField;
        const {operator, toggleIsVisibleMenuEdit} = this.props;
        let relationalOperator = operator.condition.relationalOperator;
        let isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams();
        let leftColor = operator.condition.leftStatement.color;
        let rightColor = operator.condition.rightStatement.color;
        if(title === ''){
            title = 'Click to set params';
        }
        const isLikeOperator = CCondition.isLikeOperator(relationalOperator);
        if(isLikeOperator){
            if(rightField[rightField.length - 1] === '}'){
                rightField = rightField.slice(0, rightField.length - 1);
            } else{
                rightField = `${rightField.slice(0, rightField.length - 2)}${rightField[rightField.length - 1]}`;
            }
            if(rightField[0] === '{'){
                rightField = rightField.slice(1);
            } else{
                rightField = `${rightField[0]}${rightField.slice(2)}`;
            }
        }
        if(leftColor !== ''){
            return(
                <div className={styles.if_placeholder} onClick={toggleIsVisibleMenuEdit}>
                    <div className={styles.if_placeholder_title} style={{backgroundColor: leftColor}} title={title}>{title}</div>
                    {
                        relationalOperator !== ''
                        ?
                            <div className={styles.if_placeholder_relational_operator} title={relationalOperator}>{this.getOperatorLabel()}</div>
                        :
                            null
                    }
                    {
                        isOperatorHasThreeParams
                            ?
                                <React.Fragment>
                                    <div className={styles.if_placeholder_right_property} style={{backgroundColor: leftColor}} title={rightProperty}>{rightProperty}</div>
                                    {
                                        hasValue && rightField
                                        ?
                                            <div className={styles.if_placeholder_right_property_in}>in</div>
                                        :
                                            null
                                    }
                                </React.Fragment>
                            :
                            null
                    }
                    {
                        hasValue && rightField
                        ?
                            <div className={styles.if_placeholder_right_field} style={{backgroundColor: rightColor}} title={rightField}>{rightField}</div>
                        :
                            null
                    }
                </div>
            );
        }
        return null;
    }

    renderMethodSelectLeft(){
        let {hasValue} = this.isOperatorHasValue();
        const {connection, operator, readOnly} = this.props;
        let indexSplitted = operator.index.split('_');
        let pointerWidthValue = indexSplitted.length > 0 ? 260 - ((indexSplitted.length - 1) * 20) + 'px' : '260px';
        let statement = operator.condition.leftStatement;
        let method = connection.toConnector.getMethodByColor(statement.color);
        let connector = connection.toConnector;
        if(!method){
            method = connection.fromConnector.getMethodByColor(statement.color);
            connector = connection.fromConnector;
        }
        let value = method ? method.getValueForSelectInput(connector) : null;
        let selectThemeInputStyle = {width: hasValue ? '10%' : '20%', float: 'left', transition: 'width 0.3s ease 0s',};
        let generalStyles = {width: '95%', float: 'right'};
        let source = this.getOptionsForMethods('leftStatement');
        generalStyles.width = pointerWidthValue;
        selectThemeInputStyle.padding = 0;
        return (
            <div style={selectThemeInputStyle}>
                <Select
                    name={'method'}
                    value={value}
                    onChange={(a) => this.updateColor(a)}
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
                                width: '200px',
                                zIndex: '2',
                            };
                            if(isDisabled || source.length === 0){
                                s = {
                                    ...styles,
                                    display: 'none'
                                };
                            }
                            return s;
                        },
                        valueContainer: (styles) => {
                            return{
                                ...styles,
                                padding: hasValue ? 0 : '2px 8px',
                            };
                        },
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                color: data.color,
                                background: data.color,
                                margin: '0 10%',
                                width: '80%',
                                maxWidth: 'none',
                            };
                        },
                        placeholder: (styles) => {
                            return{
                                ...styles,
                                textAlign: 'center',
                                width: '70%',
                            };
                        }
                    }}
                />
            </div>
        );
    }

    renderResponseTypeGroupLeft(){
        const {responseType} = this.state;
        const {operator} = this.props;
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        return(
            <RadioButtons
                name='response_type'
                label={''}
                value={responseType}
                handleChange={(a) => this.onChangeResponseType(a)}
                disabled={!hasMethod}
                radios={[
                    {
                        label: 's',
                        value: RESPONSE_SUCCESS,
                    },
                    {
                        label: 'f',
                        value: RESPONSE_FAIL,
                    },
                ]}
            />
        );
    }

    renderParamInputLeft(){
        let isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams();
        let {hasValue} = this.isOperatorHasValue();
        let {leftField} = this.state;
        const {connection, operator, readOnly, connector, updateEntity} = this.props;
        let inputTheme = {};
        inputTheme.input = styles.input_pointer_param_if;
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        let divStyles = {float: 'left', width: hasValue ? isOperatorHasThreeParams ? '28%' : '35%' : '55%'};
        return (
            <div style={divStyles}>
                {/*{this.renderResponseTypeGroupLeft()}*/}
                <Input
                    placeholder={'param'}
                    type={'text'}
                    value={leftField}
                    onChange={(a) => this.onChangeField(a)}
                    onBlur={(a) => this.updateLeftField(a)}
                    readOnly={readOnly || !hasMethod}
                    theme={inputTheme}
                    isPopupInput={true}
                >
                    <SelectSearch
                        id={`if_operator_${operator.type}_${operator.index}`}
                        selectedMethod={operator.condition.leftStatement ? connection.getMethodByColor(operator.condition.leftStatement.color) : null}
                        selectedConnector={operator.condition.leftStatement ? connection.getConnectorByMethodColor(operator.condition.leftStatement.color) : null}
                        updateConnection={updateEntity}
                        connection={connection}
                        className={styles.operator_left_field}
                        placeholder={'param'}
                        items={hasMethod ? this.getParamSource('leftStatement') : []}
                        readOnly={readOnly || !hasMethod}
                        doAction={(a) => this.onChangeField(a)}
                        onInputChange={(a) => this.onChangeField(a)}
                        inputValue={leftField}
                        currentConnector={connector}
                    />
                </Input>
            </div>
        );
    }

    renderOperatorInput(){
        const {operator, readOnly} = this.props;
        let isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams();
        let value = operator.condition.relationalOperator;
        let operators = FUNCTIONAL_OPERATORS_FOR_IF.map(operator => {return {value: operator.value, label: operator.hasOwnProperty('label') ? operator.label : operator.value};});
        let {hasValue} = this.isOperatorHasValue();
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        let inputTheme = {inputElement: styles.input_element_pointer_compare_statement_visible};
        let divStyles = {float: 'left', width: hasValue ? isOperatorHasThreeParams ? '14%' : '10%' : '25%', transition: 'width 0.3s ease 0s',};
        let label = this.getOperatorLabel();
        inputTheme.input = styles.input_pointer_compare_statement;
        return (
            <div style={divStyles}>
                <span className={styles.if_relational_operator_separator}/>
                <Select
                    name={'relational_operators'}
                    value={value !== '' ? {value, label} : null}
                    onChange={(a) => this.updateRelationalOperator(a)}
                    options={operators}
                    closeOnSelect={false}
                    placeholder={`...`}
                    isDisabled={readOnly || !hasMethod}
                    isSearchable={false}
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
                            boxShadow: 'none',
                            backgroundColor: 'initial',
                            borderBottom: '1px solid rgba(33, 33, 33, 0.12)'
                        }),
                        valueContainer: styles => ({
                            ...styles,
                            padding: '0',
                            textAlign: 'center',
                        }),
                        dropdownIndicator: () => ({display: 'none'}),
                        menu: (styles, {isDisabled}) => {
                            let s = {
                                ...styles,
                                top: 'auto',
                                marginTop: '-16px',
                                marginBottom: '8px',
                                width: '120px',
                                zIndex: '1',
                            };
                            if(isDisabled){
                                s = {
                                    ...styles,
                                    display: 'none'
                                };
                            }
                            return s;
                        },
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                textAlign: 'center',
                                color: data.color,
                                background: data.color,
                                margin: '0 10%',
                                width: '80%',
                                maxWidth: 'none',
                            };
                        },
                        placeholder: (styles, {data}) => {
                            return {
                                ...styles,
                                width: '70%',
                                textAlign: 'center',
                            };
                        },
                        indicatorSeparator: (styles) => {
                            return {
                                ...styles,
                                backgroundColor: 'none',
                            };
                        }
                    }}
                />
                <span className={styles.if_relational_operator_separator}/>
            </div>
        );
    }

    renderPropertyInputRight(){
        const {connection, connector, operator, readOnly, updateEntity} = this.props;
        let isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams();
        let {leftField, rightProperty} = this.state;
        let divStyles = {transition: isOperatorHasThreeParams ? 'width 0.3s ease 0s' : 'none', width: isOperatorHasThreeParams ? '17.5%' : '0', float: 'left'};
        let equalStyles = {transition: isOperatorHasThreeParams ? 'width 0.3s ease 0s' : 'none', width: isOperatorHasThreeParams ? '5%' : '0'};
        let inputTheme = {input: styles.input_pointer_compare_statement};
        return (
            <React.Fragment>
                <div style={divStyles}>
                    <Input
                        placeholder={'param'}
                        type={'text'}
                        value={rightProperty}
                        onChange={(a) => this.onChangeRightProperty(a)}
                        onBlur={(a) => this.updateRightPropertyValue(a)}
                        readOnly={readOnly}
                        theme={inputTheme}
                        isPopupInput={true}
                        disabled={!isOperatorHasThreeParams}
                    >
                        <SelectSearch
                            id={`if_operator_${operator.type}_${operator.index}`}
                            selectedMethod={operator.condition.leftStatement ? connection.getMethodByColor(operator.condition.leftStatement.color) : null}
                            selectedConnector={operator.condition.leftStatement ? connection.getConnectorByMethodColor(operator.condition.leftStatement.color) : null}
                            updateConnection={updateEntity}
                            connection={connection}
                            className={styles.operator_right_field}
                            placeholder={'param'}
                            items={this.getParamSource('leftStatement')}
                            readOnly={readOnly}
                            doAction={(a) => this.onChangeRightProperty(a)}
                            onInputChange={(a) => this.onChangeRightProperty(a)}
                            inputValue={rightProperty}
                            predicator={leftField}
                            currentConnector={connector}
                        />
                    </Input>
                </div>
                <div className={styles.property_input_right_equal} style={equalStyles}>
                    =
                </div>
            </React.Fragment>
        );
    }

    renderMethodSelectRight(){
        let {hasValue, isRightStatementText, isRightStatementOption} = this.isOperatorHasValue();
        const {rightField} = this.state;
        const {connection, operator, readOnly} = this.props;
        let indexSplitted = operator.index.split('_');
        let pointerWidthValue = indexSplitted.length > 0 ? 260 - ((indexSplitted.length - 1) * 20) + 'px' : '260px';
        let statement = operator.condition.rightStatement;
        let method = connection.toConnector.getMethodByColor(statement.color);
        let connector = connection.toConnector;
        if(!method){
            method = connection.fromConnector.getMethodByColor(statement.color);
            connector = connection.fromConnector;
        }
        let value = method ? method.getValueForSelectInput(connector) : null;
        let isVisible = hasValue && !(rightField !== '' && value === null);
        if(isRightStatementText || isRightStatementOption){
            isVisible = false;
        }
        if(this.isLikeOperator(operator.condition.relationalOperator)){
            if(rightField === '{}'){
                isVisible = true;
            }
        }
        let selectThemeInputStyle = {width: isVisible ? '10%' : '0', float: 'left', maxHeight: '38px', transition: isVisible ? 'width 0.3s ease 0s' : 'none',};
        let generalStyles = {width: '95%', float: 'right'};
        let source = this.getOptionsForMethods('rightStatement');
        generalStyles.width = pointerWidthValue;
        selectThemeInputStyle.padding = 0;
        return (
            <div style={selectThemeInputStyle}>
                <Select
                    name={'method'}
                    value={value}
                    onChange={(a) => this.updateColorRight(a)}
                    options={source.length > 0 ? source : [{label: 'No params', value: 0, color: 'white'}]}
                    closeOnSelect={false}
                    placeholder={rightField !== '' && value === null ? '' : '...'}
                    isDisabled={readOnly || !isVisible}
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
                                width: '200px',
                                zIndex: '3',
                            };
                            if(isDisabled || source.length === 0){
                                s = {
                                    ...styles,
                                    display: 'none'
                                };
                            }
                            return s;
                        },
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                color: data.color,
                                background: data.color,
                                margin: '0 10%',
                                width: '80%',
                                maxWidth: 'none',
                            };
                        },
                        valueContainer: (styles) => {
                            return{
                                ...styles,
                                padding: 0,
                            };
                        },
                        input: (styles) => {
                            return{
                                ...styles,
                                margin: 0,
                                padding: 0,
                            };
                        },
                        placeholder: (styles, {data}) => {
                            return {
                                ...styles,
                                width: '70%',
                                textAlign: 'center',
                            };
                        },
                    }}
                />
            </div>
        );
    }

    renderResponseTypeGroupRight(){
        const {responseType} = this.state;
        const {operator} = this.props;
        let hasMethod = operator.condition.rightStatement.color !== '' && operator.condition.rightStatement.color !== DEFAULT_COLOR;
        return(
            <RadioButtons
                name='response_type'
                label={''}
                value={responseType}
                handleChange={(a) => this.onChangeResponseTypeRight(a)}
                disabled={!hasMethod}
                radios={[
                    {
                        label: 's',
                        value: RESPONSE_SUCCESS,
                    },
                    {
                        label: 'f',
                        value: RESPONSE_FAIL,
                    },
                ]}
            />
        );
    }

    renderParamInputRight(){
        let {hasValue, isRightStatementText, isRightStatementOption, options, isMultiline, popupInputStyles} = this.isOperatorHasValue();
        let {rightField} = this.state;
        const {connection, connector, operator, readOnly, updateEntity} = this.props;
        let isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams();
        let statement = operator.condition.rightStatement;
        let method = connection.toConnector.getMethodByColor(statement.color);
        if(!method){
            method = connection.fromConnector.getMethodByColor(statement.color);
        }
        let methodValue = method ? {label: method.name, value: method.index, color: method.color} : null;
        let isMethodSelectRightInvisible = methodValue === null && rightField !== '' || isRightStatementText;
        let inputTheme = {inputElement: hasValue ? styles.input_element_pointer_compare_statement_visible : styles.input_element_pointer_compare_statement_not_visible};
        const isLikeOperator = this.isLikeOperator();
        let divStyles = {transition: hasValue ? 'width 0.3s ease 0s' : 'none', width: hasValue ? isMethodSelectRightInvisible ? isOperatorHasThreeParams ? '27.5%' : '45%' : isOperatorHasThreeParams ? '15.5%' : '35%' : '0', float: 'left'};
        inputTheme.input = styles.input_pointer_compare_statement;
        if(isLikeOperator){
            divStyles.width = "25%";
            if(rightField.length > 1){
                if(rightField[rightField.length - 1] === '%'){
                    rightField = rightField.substr(0, rightField.length - 1);
                }
                if(rightField[0] === '%'){
                    rightField = rightField.substr(1, rightField.length);
                }
                rightField = CCondition.excludeFieldFromLikeOperator(rightField);
            }
        }
        if(isRightStatementOption){
            return(
                <div className={styles.param_input_right} style={{...divStyles}}>
                    <span className={styles.if_relational_operator_separator}/>
                    <Select
                        name={'relational_operators'}
                        value={rightField !== '' ? options.find(option => option.value === rightField) : null}
                        onChange={(a) => this.selectRightField(a)}
                        options={options}
                        closeOnSelect={false}
                        placeholder={`...`}
                        isDisabled={readOnly}
                        isSearchable={false}
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
                                boxShadow: 'none',
                                backgroundColor: 'initial',
                                borderBottom: '1px solid rgba(33, 33, 33, 0.12)'
                            }),
                            valueContainer: styles => ({
                                ...styles,
                                padding: '0',
                                textAlign: 'center',
                            }),
                            dropdownIndicator: () => ({display: 'none'}),
                            menu: (styles, {isDisabled}) => {
                                let s = {
                                    ...styles,
                                    top: 'auto',
                                    marginTop: '-16px',
                                    marginBottom: '8px',
                                    width: '120px',
                                    zIndex: '1',
                                };
                                if(isDisabled){
                                    s = {
                                        ...styles,
                                        display: 'none'
                                    };
                                }
                                return s;
                            },
                            singleValue: (styles, {data}) => {
                                return {
                                    ...styles,
                                    textAlign: 'center',
                                    color: data.color,
                                    background: data.color,
                                    margin: '0 10%',
                                    width: '80%',
                                    maxWidth: 'none',
                                };
                            },
                            placeholder: (styles, {data}) => {
                                return {
                                    ...styles,
                                    width: '70%',
                                    textAlign: 'center',
                                };
                            },
                            indicatorSeparator: (styles) => {
                                return {
                                    ...styles,
                                    backgroundColor: 'none',
                                };
                            }
                        }}
                    />
                    <span className={styles.if_relational_operator_separator}/>
                </div>
            );
        }
        return (
            <div className={styles.param_input_right} style={{...divStyles}}>
                {/*{this.renderResponseTypeGroupRight()}*/}
                <Input
                    placeholder={'param'}
                    type={'text'}
                    value={rightField}
                    onChange={(a) => this.onChangeRightField(a)}
                    onBlur={(a) => this.updateRightField(a)}
                    readOnly={readOnly}
                    theme={inputTheme}
                    isPopupInput={true}
                    disabled={!hasValue}
                    popupInputStyles={popupInputStyles}
                >
                    <SelectSearch
                        id={`if_operator_${operator.type}_${operator.index}`}
                        selectedMethod={operator.condition.rightStatement ? connection.getMethodByColor(operator.condition.rightStatement.color) : null}
                        selectedConnector={operator.condition.rightStatement ? connection.getConnectorByMethodColor(operator.condition.rightStatement.color) : null}
                        connection={connection}
                        updateConnection={updateEntity}
                        className={styles.operator_right_field}
                        placeholder={'param'}
                        items={this.getParamSource('rightStatement')}
                        readOnly={readOnly}
                        doAction={(a) => this.onChangeRightField(a)}
                        onInputChange={(a) => this.onChangeRightField(a)}
                        inputValue={rightField}
                        currentConnector={connector}
                        isPopupMultiline={isMultiline}
                        popupRows={isMultiline ? 4 : 1}
                    />
                </Input>
            </div>
        );
    }

    renderLeftStatement(){
        return(
            <React.Fragment>
                {this.renderMethodSelectLeft()}
                {this.renderParamInputLeft()}
            </React.Fragment>
        );
    }

    isLikeOperator(){
        const {operator} = this.props;
        const condition = operator.condition;
        return condition && condition.relationalOperator && CCondition.isLikeOperator(condition.relationalOperator);
    }

    setLeftLikeSign(){
        let {rightField} = this.state;
        const splitRightParam = rightField.split('{');
        if(splitRightParam.length > 1){
            if(splitRightParam[1][0] === '}'){
                return;
            }
        }
        if(rightField[0] === '%'){
            rightField = rightField.substring(1);
        } else{
            rightField = `%${rightField}`;
        }
        this.setState({
            rightField,
        });
    }

    setRightLikeSign(){
        let {rightField} = this.state;
        const splitRightParam = rightField.split('{');
        if(splitRightParam.length > 1){
            if(splitRightParam[1][0] === '}'){
                return;
            }
        }
        if(rightField[rightField.length - 1] === '%'){
            rightField = rightField.substr(0, rightField.length - 1);
        } else{
            rightField += '%';
        }
        this.setState({
            rightField,
        });
    }

    renderRightStatement(){
        let {rightField} = this.state;
        const isLikeOperator = this.isLikeOperator();
        let hasLeftLikeSign = false;
        let hasRightLikeSign = false;
        if(isLikeOperator){
            if(rightField.length > 1){
                if(rightField[rightField.length - 1] === '%'){
                    hasRightLikeSign = true;
                    rightField = rightField.substr(0, rightField.length - 1);
                }
                if(rightField[0] === '%'){
                    hasLeftLikeSign = true;
                }
            }
        }
        return(
            <React.Fragment>
                {this.renderPropertyInputRight()}
                <LikePercentageStyled isLikeOperator={isLikeOperator} hasSign={hasLeftLikeSign}>
                    <div onClick={() => this.setLeftLikeSign()}>%</div>
                </LikePercentageStyled>
                {this.renderMethodSelectRight()}
                {this.renderParamInputRight()}
                <LikePercentageStyled isLikeOperator={isLikeOperator} hasSign={hasRightLikeSign}>
                    <div onClick={() => this.setRightLikeSign()}>%</div>
                </LikePercentageStyled>
            </React.Fragment>
        );
    }

    render(){
        const {connector, operator, tooltip, isVisibleMenuEdit, renderCloseMenuEditButton, intend} = this.props;
        let classNames = styles.operator_icon;
        let isOperatorHasThreeParams = this.checkIfOperatorHasThreeParams();
        let isCurrentItem = connector.getCurrentItem() && operator ? connector.getCurrentItem().index === operator.index : false;
        let operatorStyle = {
            height: '57.6px',
            width: `calc(100% - ${intend})`,
            padding: '5px',
            transition: 'width 0.5s ease 0s',
            boxShadow: 'rgb(159, 159, 159) 0px 0px 3px 0px',
        };
        if(isCurrentItem){
            operatorStyle.boxShadow = `0 0 0 0 rgba(0, 0, 0, .14), 0px 1px 7px 1px rgb(159, 159, 159), 0 1px 1px 0 rgba(0, 0, 0, .22)`;
            operatorStyle.borderRadius = '3px';
            classNames += ` ${styles.selected_item}`;
        }
        if(operator.error.hasError){
            operatorStyle.boxShadow = `rgba(0, 0, 0, 0.14) 0px 0px 0px 0px, rgba(230, 0, 0, 0.76) 0px 1px 7px 1px, rgba(0, 0, 0, 0.22) 0px 1px 1px 0px`;
            operatorStyle.border = 'border: 1px solid #d14b4b';
        }
        let menuEditStyles = {width: '100%'};
        return (
            <div style={{display: 'flex'}}>
                <div style={{height: '57.6px', width: intend, transition: 'width 0.5s ease 0s'}}/>
                <div style={operatorStyle}>
                    <div style={{float: 'left', width: '10%', marginTop: '10px'}}>
                        <TooltipFontIcon
                            className={classNames}
                            style={{transform: "rotate(180deg)"}}
                            tooltip={tooltip}
                            value={'call_split'}
                            onClick={(a) => this.setCurrentItem(a)}
                            tooltipPosition={'top'}
                        />
                    </div>
                    {
                        isVisibleMenuEdit
                        ?
                            <div className={styles.menu_edit} style={menuEditStyles} onClick={(a) => this.setCurrentItem(a)}>
                                {this.renderLeftStatement()}
                                {this.renderOperatorInput()}
                                {this.renderRightStatement()}
                                {renderCloseMenuEditButton()}
                            </div>
                        :
                            this.renderPlaceholder()
                    }
                </div>
            </div>
        );
    }
}

IfOperator.propTypes = {
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    operator: PropTypes.instanceOf(COperatorItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
    firstItemIndex: PropTypes.string,
};

export default IfOperator;