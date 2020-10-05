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

import styles from '@themes/default/general/form_methods.scss';
import SelectSearch from "@basic_components/inputs/SelectSearch";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "@classes/components/content/invoker/response/CResponse";
import Input from "@basic_components/inputs/Input";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CStatement, {STATEMENT_RESPONSE} from "@classes/components/content/connection/operator/CStatement";
import {dotColor} from "../help";
import {findTopLeft} from "@utils/app";
import ReactDOM from "react-dom";
import RadioButtons from "@basic_components/inputs/RadioButtons";
import Select from "@basic_components/inputs/Select";


class ParamGenerator extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showGenerator: false,
            color: '',
            field: '',
            responseType: RESPONSE_SUCCESS,
        };
        const {top, left} = findTopLeft(props.parent);
        this.top = top;
        this.left = left;
    }

    componentWillUnmount(){
        const {id} = this.props;
        let elem = document.getElementById(id);
        if(elem){
            elem.innerText = '';
        }
    }

    /**
     * to change field value
     */
    toggleShowGenerator(){
        this.setState({showGenerator: !this.state.showGenerator});
    }

    setIdValue(){
        const {color, responseType, field} = this.state;
        const {id} = this.props;
        let elem = document.getElementById(id);
        if(field !== '') {
            if (elem) {
                let statement = CStatement.createStatement({
                    color,
                    field: `${responseType}.${field}`,
                    type: STATEMENT_RESPONSE,
                    parent: this.getParamSource()
                });
                statement = statement.getObject();
                elem.innerText = `${statement.color}.(${statement.type}).${statement.field}`;
            }
        }
    }

    /**
     * to change field value
     */
    onChangeField(field){
        this.setState({field}, this.setIdValue());
    }

    /**
     * to change responseType
     */
    onChangeResponseType(responseType){
        this.setState({
            responseType,
            field: '',
        });
    }

    /**
     * to get options for methods select
     */
    getOptionsForMethods(){
        let {connection, connector, method} = this.props;
        return connection.getOptionsForMethods(connector, method, {isKeyConsidered: false, exceptCurrent: false});
    }

    /**
     * to change color
     */
    updateColor(method){
        this.setState({
            color: method.color,
            field: '',
            responseType: RESPONSE_SUCCESS,
        });
    }

    getParamSource(){
        const {responseType, color} = this.state;
        const {connection} = this.props;
        let method = connection.getConnectorMethodByColor(color);
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

    addParam(){
        const {color, responseType, field} = this.state;
        const {addParam, isVisible} = this.props;

        let statement = CStatement.createStatement({color, field: `${responseType}.${field}`, type: STATEMENT_RESPONSE, parent: this.getParamSource()});
        statement = statement.getObject();
        addParam(`${statement.color}.(${statement.type}).${statement.field}`);
        if(!isVisible) {
            this.setState({showGenerator: !this.state.showGenerator});
        }
    }

    renderMethodSelect(){
        const {color} = this.state;
        const {connection, readOnly, selectId} = this.props;
        let method = connection.toConnector.getMethodByColor(color);
        let connector = connection.toConnector;
        if(!method){
            method = connection.fromConnector.getMethodByColor(color);
            connector = connection.fromConnector;
        }
        let value = method ? method.getValueForSelectInput(connector) : null;
        let selectThemeInputStyle = {width: '70px', float: 'left'};
        let source = this.getOptionsForMethods();
        selectThemeInputStyle.padding = 0;
        return (
            <div style={selectThemeInputStyle}>
                <Select
                    id={selectId}
                    name={'...'}
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
                                margin: 0,
                                maxWidth: '100%',
                                color: data.color,
                                background: data.color,
                                width: '65%'
                            };
                        }
                    }}
                />
            </div>
        );
    }

    renderResponseTypeGroup(){
        const {color, responseType} = this.state;
        let hasMethod = color !== '';
        return (
            <RadioButtons
                label={''}
                value={responseType}
                handleChange={::this.onChangeResponseType()}
                disabled={!hasMethod}
                radios={[
                    {
                        value: RESPONSE_SUCCESS,
                        label: 's',
                    },
                    {
                        value: RESPONSE_FAIL,
                        label: 'f',
                    }
                ]}
            />
        );
    }

    submitEdit(){
        this.props.submitEdit();
    }

    renderParamInput(){
        let {field, color, readOnly} = this.state;
        let {method, submitEdit} = this.props;
        let hasMethod = color !== '';
        let inputTheme = {};
        let divStyles = {float: 'left', width: '130px'};
        inputTheme.input = styles.param_generator_param;
        return (
            <div style={divStyles}>
                {/*{::this.renderResponseTypeGroup()}*/}
                <Input
                    placeholder={'param'}
                    type={'text'}
                    value={field}
                    onChange={::this.onChangeField}
                    onBlur={null}
                    readOnly={readOnly || !hasMethod}
                    theme={inputTheme}
                    isPopupInput={true}
                >
                    <SelectSearch
                        id={`param_generator_${method.index}`}
                        className={styles.operator_left_field}
                        placeholder={'param'}
                        items={hasMethod ? this.getParamSource() : []}
                        readOnly={readOnly || !hasMethod}
                        doAction={::this.onChangeField}
                        onInputChange={::this.onChangeField}
                        inputValue={field}
                        submitEdit={submitEdit}
                        autoFocus
                    />
                </Input>
            </div>
        );
    }

    renderArrowIcon(){
        const {showGenerator} = this.state;
        const {isVisible, readOnly} = this.props;
        if(readOnly){
            return null;
        }
        if(!isVisible) {
            if (showGenerator) {
                return (
                    <TooltipFontIcon key={1} value={'keyboard_arrow_left'} tooltip={'Hide Param Generator'}
                                     onClick={::this.toggleShowGenerator}/>
                );
            } else {
                return (
                    <TooltipFontIcon value={'keyboard_arrow_right'}
                                     tooltip={showGenerator ? 'Hide Param Generator' : 'Show Param Generator'}
                                     onClick={::this.toggleShowGenerator}/>
                );
            }
        }
        return null;
    }

    renderGenerator(){
        const {showGenerator} = this.state;
        const {isVisible, isAbsolute, parent, submitEdit} = this.props;
        if(this.getOptionsForMethods().length === 0){
            return null;
        }
        return(
            <div className={isAbsolute ?  styles.param_generator : styles.param_generator_not_absolute} style={parent ? {left: this.left, top: this.top} : {}}>
                {::this.renderArrowIcon()}
                {
                    showGenerator || isVisible
                        ?
                        <div key={2} className={isAbsolute ? styles.param_generator_form : ''}>
                            {this.renderMethodSelect()}
                            {this.renderParamInput()}
                            <TooltipFontIcon tooltip={'Add'} value={'add'} className={styles.param_generator_form_add} onClick={submitEdit ? submitEdit : ::this.addParam}/>
                        </div>
                        :
                        null
                }
            </div>
        );
    }

    render(){
        const {parent} = this.props;
        if(parent){
            return ReactDOM.createPortal(this.renderGenerator(),
                document.getElementById('oc_generator_modal'));
        }
        return this.renderGenerator();
    }
}

ParamGenerator.defaultProps = {
    isAbsolute: true,
    parent: null,
    submitEdit: null,
};

export default ParamGenerator;