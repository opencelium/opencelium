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
import {
    DEFAULT_COLOR,
} from "@classes/components/content/connection/operator/CStatement";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import CConnection from "@classes/components/content/connection/CConnection";
import SelectSearch from "@basic_components/inputs/SelectSearch";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "@classes/components/content/invoker/response/CResponse";
import Input from "@basic_components/inputs/Input";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import Select from "@basic_components/inputs/Select";


/**
 * LoopOperator Component
 */
class LoopOperator extends Component{

    constructor(props){
        super(props);
        let field = props.operator.condition.leftStatement.getFieldWithoutArrayBrackets();
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
        this.setState({field});
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
        return connection.getOptionsForMethods(connector, operator, {isKeyConsidered: false, exceptCurrent: false});
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

    renderPlaceholder(){
        let title = this.state.field;
        const {operator, toggleIsVisibleMenuEdit} = this.props;
        let color = operator.condition.leftStatement.color;
        if(title === ''){
            title = 'Click to set params';
        }
        if(color !== ''){
            return(
                <div className={styles.loop_placeholder}>
                    <div className={styles.loop_placeholder_title} style={{backgroundColor: color}} title={title} onClick={toggleIsVisibleMenuEdit}>{title}</div>
                </div>
            );
        }
        return null;
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
            <div style={selectThemeInputStyle}>
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
                        singleValue: (styles, {data}) => {
                            return {
                                ...styles,
                                color: data.color,
                                background: data.color,
                                margin: '0 10%',
                                width: '80%',
                                maxWidth: 'none',
                            };
                        }
                    }}
                />
            </div>
        );
    }

    renderResponseTypeGroup(){
        const {responseType} = this.state;
        const {operator} = this.props;
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        return(
            <RadioButtons
                name='response_type'
                label={''}
                value={responseType}
                handleChange={::this.onChangeResponseType}
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

    renderParamInput(){
        let {field} = this.state;
        const {connection, operator, connector, readOnly, updateEntity} = this.props;
        let hasMethod = operator.condition.leftStatement.color !== '' && operator.condition.leftStatement.color !== DEFAULT_COLOR;
        let inputTheme = {};
        let divStyles = {float: 'left', width: '70%'};
        inputTheme.input = styles.input_pointer_param_loop;
        return (
            <div style={divStyles}>
                {/*{::this.renderResponseTypeGroup()}*/}
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
                        selectedMethod={operator.condition.leftStatement ? connection.getMethodByColor(operator.condition.leftStatement.color) : null}
                        selectedConnector={operator.condition.leftStatement ? connection.getConnectorByMethodColor(operator.condition.leftStatement.color) : null}
                        connection={connection}
                        updateConnection={updateEntity}
                        className={styles.operator_left_field}
                        placeholder={'param'}
                        items={hasMethod ? this.getParamSource() : []}
                        readOnly={readOnly || !hasMethod}
                        doAction={::this.onChangeField}
                        onInputChange={::this.onChangeField}
                        inputValue={field}
                        currentConnector={connector}
                    />
                </Input>
            </div>
        );
    }

    render(){
        const {connector, tooltip, operator, isVisibleMenuEdit, renderCloseMenuEditButton, intend} = this.props;
        let classNames = styles.operator_icon;
        let isCurrentItem = connector.getCurrentItem() && operator ? connector.getCurrentItem().index === operator.index : null;
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
        return (
            <div style={{display: 'flex'}}>
                <div style={{height: '57.6px', width: intend, transition: 'width 0.5s ease 0s'}}/>
                <div style={operatorStyle} onClick={::this.setCurrentItem}>
                    <div style={{float: 'left', width: '10%', marginTop: '10px'}}>
                        <TooltipFontIcon
                            className={classNames}
                            tooltip={tooltip}
                            value={'loop'}
                            onClick={::this.setCurrentItem}
                            tooltipPosition={'top'}
                        />
                    </div>
                    <span title={'Iterator'}className={styles.operator_iterator}>{operator.iterator}</span>
                    {
                        isVisibleMenuEdit
                        ?
                            <div className={styles.menu_edit} onClick={::this.setCurrentItem}>
                                {this.renderMethodSelect()}
                                {this.renderParamInput()}
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

LoopOperator.propTypes = {
    tooltip: PropTypes.string,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    operator: PropTypes.instanceOf(COperatorItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
    styles: PropTypes.object,
};

LoopOperator.defaultProps = {
    styles: {},
    tooltip: '',
};

export default LoopOperator;