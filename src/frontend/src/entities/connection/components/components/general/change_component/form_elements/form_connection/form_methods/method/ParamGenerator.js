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

import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import SelectSearch from "@entity/connection/components/components/general/basic_components/inputs/SelectSearch";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "@entity/connection/components/classes/components/content/invoker/response/CResponse";
import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import CStatement, {STATEMENT_RESPONSE} from "@entity/connection/components/classes/components/content/connection/operator/CStatement";
import {findTopLeft, setFocusById} from "@application/utils/utils";
import ReactDOM from "react-dom";
import RadioButtons from "@entity/connection/components/components/general/basic_components/inputs/RadioButtons";
import Select from "@entity/connection/components/components/general/basic_components/inputs/Select";
import {addCloseParamGeneratorNavigation, removeCloseParamGeneratorNavigation} from "@entity/connection/components/utils/key_navigation";


class ParamGenerator extends Component {

    constructor(props) {
        super(props);
        this.state = {
            showGenerator: false,
            color: '',
            field: '',
            responseType: RESPONSE_SUCCESS,
            shouldClose: false,
        };
        const {top, left} = findTopLeft(props.parent);
        this.top = top;
        this.left = left;
    }

    componentDidMount(){
        addCloseParamGeneratorNavigation(this);
    }

    componentWillUnmount(){
        const {id} = this.props;
        let elem = document.getElementById(id);
        if(elem){
            elem.innerText = '';
        }
        removeCloseParamGeneratorNavigation(this);
    }

    /**
     * to change field value
     */
    toggleShowGenerator(){
        const {connector, method} = this.props;
        this.setState({showGenerator: !this.state.showGenerator}, () => {
            if(this.state.showGenerator){
                setFocusById(`param_generator_add_${connector.getConnectorType()}_${method.index}`)
                setFocusById(`param_generator_select_${connector.getConnectorType()}_${method.index}`, 300)
            }
        });
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
        const {connection, readOnly, selectId, theme} = this.props;
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
        let themeGeneratorFormMethod = '';
        if(theme && theme.hasOwnProperty('generatorFormMethod')) themeGeneratorFormMethod = theme.generatorFormMethod;
        return (
            <div style={selectThemeInputStyle} className={themeGeneratorFormMethod}>
                <Select
                    id={`param_generator_select_${this.props.connector.getConnectorType()}_${this.props.method.index}`}
                    name={'...'}
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
                    selectMenuPlaceholderStyles={{
                        left: `calc(50% - 10px)`,
                    }}
                    styles={{
                        container: (provided, {isFocused, isDisabled}) => ({
                            fontSize: '12px',
                            borderBottom: isFocused && !isDisabled ? '2px solid #3f51b5 !important' : 'none',
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
                                margin: '0 5%',
                                maxWidth: '100%',
                                color: data.color,
                                background: data.color,
                                width: '90%'
                            };
                        },
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
                handleChange={(a) => this.onChangeResponseType(a)}
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
        let {connection, method, connector, submitEdit, theme, updateConnection} = this.props;
        let hasMethod = color !== '';
        let inputTheme = {};
        let divStyles = {float: 'left', width: '130px'};
        inputTheme.input = styles.param_generator_param;
        let themeGeneratorFormParam = '';
        if(theme && theme.hasOwnProperty('generatorFormParam')) themeGeneratorFormParam = theme.generatorFormParam;
        return (
            <div style={divStyles} className={themeGeneratorFormParam}>
                {/*{::this.renderResponseTypeGroup()}*/}
                <Input
                    placeholder={'param'}
                    type={'text'}
                    value={field}
                    onChange={(a) => this.onChangeField(a)}
                    onBlur={null}
                    readOnly={readOnly || !hasMethod}
                    theme={inputTheme}
                    isPopupInput={true}
                    disabled={!hasMethod}
                >
                    <SelectSearch
                        id={`param_generator_${method.index}`}
                        selectedMethod={connection.getMethodByColor(color)}
                        selectedConnector={connection.getConnectorByMethodColor(color)}
                        updateConnection={updateConnection}
                        connection={connection}
                        className={styles.operator_left_field}
                        placeholder={'param'}
                        items={hasMethod ? this.getParamSource() : []}
                        readOnly={readOnly || !hasMethod}
                        doAction={(a) => this.onChangeField(a)}
                        onInputChange={(a) => this.onChangeField(a)}
                        inputValue={field}
                        submitEdit={submitEdit}
                        currentConnector={connector}
                        autoFocus
                    />
                </Input>
            </div>
        );
    }

    renderArrowIcon(){
        const {showGenerator} = this.state;
        const {isVisible, readOnly, isArrowVisible} = this.props;
        if(readOnly || !isArrowVisible){
            return null;
        }
        if(!isVisible) {
            if (showGenerator) {
                return (
                    <TooltipFontIcon
                        isButton={true}
                        value={'keyboard_arrow_left'}
                        tooltip={'Hide Param Generator'}
                        onClick={(a) => this.toggleShowGenerator(a)}/>
                );
            } else {
                return (
                    <TooltipFontIcon
                        isButton={true}
                        value={'keyboard_arrow_right'}
                        tooltip={showGenerator ? 'Hide Param Generator' : 'Show Param Generator'}
                        onClick={(a) => this.toggleShowGenerator(a)}/>
                );
            }
        }
        return null;
    }

    renderGenerator(){
        const {showGenerator, color, field} = this.state;
        const hasMethod = color !== '' && field !== '';
        const {connector, method, isAlwaysVisible, theme, isVisible, isAbsolute, parent, submitEdit, actionButtonTooltip, actionButtonValue} = this.props;
        if(this.getOptionsForMethods().length === 0){
            return null;
        }
        let themeParamGenerator = '';
        let themeParamGeneratorForm = '';
        if(theme){
            if(theme.hasOwnProperty('paramGenerator')) themeParamGenerator = theme.paramGenerator;
            if(theme.hasOwnProperty('paramGeneratorForm')) themeParamGeneratorForm = theme.paramGeneratorForm;
        }
        return(
            <div className={`${isAbsolute ?  styles.param_generator : styles.param_generator_not_absolute} ${themeParamGenerator}`} style={parent ? {left: this.left, top: this.top} : {}}>
                {this.renderArrowIcon()}
                {
                    showGenerator || isVisible || isAlwaysVisible
                        ?
                        <div key={2} className={`${isAbsolute ? styles.param_generator_form : ''} ${themeParamGeneratorForm}`}>
                            {this.renderMethodSelect()}
                            {this.renderParamInput()}
                            <TooltipFontIcon
                                id={`param_generator_add_${connector.getConnectorType()}_${method.index}`}
                                isButton={true}
                                tooltip={actionButtonTooltip}
                                value={actionButtonValue}
                                className={styles.param_generator_form_add}
                                onClick={(e) => {if(hasMethod){
                                    if(submitEdit){
                                         submitEdit(e);
                                    } else{
                                        this.addParam(e)
                                    }
                                } }}
                            />
                        </div>
                        :
                        null
                }
            </div>
        );
    }

    render(){
        const {shouldClose} = this.state;
        const {isVisible} = this.props;
        if(shouldClose && isVisible){
            return null;
        }
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
    actionButtonTooltip: 'Add',
    actionButtonValue: 'add',
    theme: null,
    isArrowVisible: true,
    isAlwaysVisible: false,
    updateConnection: null,
};

export default ParamGenerator;