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

import {renderToString} from 'react-dom/server';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';

import styles from '@themes/default/general/form_methods.scss';
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import ParamGenerator from "./ParamGenerator";
import ToolboxThemeInput from "../../../../../../../hocs/ToolboxThemeInput";
import {freeStringFromAmp, getCaretPositionOfDivEditable, setFocusByCaretPositionInDivEditable} from "@utils/app";
import QueryString from "@change_component/form_elements/form_connection/form_methods/method/query_string/QueryString";
import CEndpoint from "@classes/components/general/change_component/form_elements/CEndpoint";
import {BACKSPACE_KEY_CODE} from "@utils/constants/inputs";

const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];

function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return{
        authUser,
    };
}

@connect(mapStateToProps, {})
class Endpoint extends Component{

    constructor(props){
        super(props);
        this.endpointValue = React.createRef();
        this.hasAdded = false;
        this.state = {
            contentEditableValue: props.method.request.endpoint,
            caretPosition: -1,
            currentKeyCode: '',
            actionButtonTooltip: 'Add',
            actionButtonValue: 'add',
            isCaretPositionFocusedOnReference: false,
        }
    }

    onChangeEndpoint(e){
        const {caretPosition, contentEditableValue, currentKeyCode} = this.state;
        const {method} = this.props;
        let endpointDiv = this.getEndpointHtmlElement();
        const value = e.target.value;
        let newCaretPosition = 0;
        let hasFoundNewCaretPosition = false;
        if(value) {
            let result = '';
            let elements = value.split('</span>');
            for (let i = 0; i < elements.length; i++) {
                if (elements[i] !== '') {
                    let index = elements[i].indexOf('>');
                    if (elements[i].indexOf('data-value="param"') === -1) {
                        const parsedValue = freeStringFromAmp(elements[i].substring(index + 1, elements[i].length));
                        if(elements[i].indexOf('data-value="invoker_reference"') === -1) {
                            result += parsedValue;
                            if(!hasFoundNewCaretPosition) {
                                newCaretPosition += parsedValue.length;
                            }
                        } else{
                            let hasLastSymbolSpace = !parsedValue[parsedValue.length - 1].trim();
                            if(hasLastSymbolSpace){
                                result += `{${parsedValue.substr(0, parsedValue.length - 1)}} `;
                            } else {
                                let dataMainValue = elements[i].split('data-main="')[1].split('"')[0];
                                if(dataMainValue === parsedValue) {
                                    result += `{${parsedValue}}`;
                                    if(!hasFoundNewCaretPosition) {
                                        newCaretPosition += parsedValue.length;
                                    }
                                } else{
                                    hasFoundNewCaretPosition = true;
                                }
                            }
                        }
                    } else {
                        let param = elements[i].split('data-main="')[1].split('"')[0];
                        let paramName = param.split('.').slice(3).join('.').slice(0, -2);
                        let checkParamName = elements[i].substring(elements[i].indexOf('>') + 1);
                        if (checkParamName.indexOf(paramName) === 0) {
                            result += freeStringFromAmp(param);
                            if (checkParamName.length > paramName.length) {
                                result += freeStringFromAmp(checkParamName.substring(paramName.length));
                            }
                            if(!hasFoundNewCaretPosition) {
                                newCaretPosition += paramName.length;
                            }
                        } else{
                            hasFoundNewCaretPosition = true;
                        }
                    }
                }
            }
            const beforeValue = this.freeStringFromReferences(contentEditableValue);
            const afterValue = this.freeStringFromReferences(result);
            const isRemovedReference = beforeValue.length - afterValue.length > 1;
            const isRemovedCharacter = beforeValue.length - afterValue.length === 1;
            const isAddedCharacter = afterValue.length - beforeValue.length === 1;
            this.setState({
                contentEditableValue: result,
            }, () => {
                if(isRemovedReference) {
                    setFocusByCaretPositionInDivEditable(endpointDiv, newCaretPosition);
                }
                if(isAddedCharacter){
                    setFocusByCaretPositionInDivEditable(endpointDiv, caretPosition + 1);
                }
                if(isRemovedCharacter){
                    newCaretPosition = caretPosition;
                    if(currentKeyCode === BACKSPACE_KEY_CODE) {
                        newCaretPosition = caretPosition - 1;
                    }
                    setFocusByCaretPositionInDivEditable(endpointDiv, newCaretPosition);
                }
            });
        }
    }

    getEndpointIdName(){
        const {connector, method} = this.props;
        const connectorType = connector.getConnectorType();
        return `endpoint_${connectorType}_${method.index}`;
    }

    getEndpointHtmlElement(){
        return document.getElementById(this.getEndpointIdName());
    }

    freeStringFromReferences(str){
        let result = '';
        let stringsWithStartReferences = str.split('{%#');
        for(let i = 0; i < stringsWithStartReferences.length; i++){
            let stringsWithEndReferences = stringsWithStartReferences[i].split('%}');
            if(stringsWithEndReferences.length > 0){
                if(stringsWithEndReferences.length === 1){
                    result += stringsWithEndReferences;
                } else{
                    let reference = stringsWithEndReferences[0].split('.');
                    reference = reference.splice(3).join('.');
                    result += reference;
                    result += stringsWithEndReferences[1];
                }
            }
        }
        return result;
    }

    setCaretPosition(e){
        let {currentKeyCode, contentEditableValue, actionButtonTooltip, actionButtonValue, isCaretPositionFocusedOnReference} = this.state;
        const {connector} = this.props;
        const requiredInvokerData = connector.invoker.data;
        let editableEndpoint = this.getEndpointHtmlElement();
        let caretPosition = getCaretPositionOfDivEditable(editableEndpoint);
        if(e.keyCode){
            currentKeyCode = e.keyCode;
        }
        if(CEndpoint.isCaretPositionFocusedOnReference(caretPosition, contentEditableValue, requiredInvokerData)){
            isCaretPositionFocusedOnReference = true;
            actionButtonTooltip = 'Replace';
            actionButtonValue = 'autorenew';
        } else{
            actionButtonTooltip = 'Add';
            actionButtonValue = 'add';
        }
        this.setState({
            caretPosition,
            currentKeyCode,
            actionButtonTooltip,
            actionButtonValue,
            isCaretPositionFocusedOnReference,
        }, () => {
            if(isCaretPositionFocusedOnReference){
                setFocusByCaretPositionInDivEditable(editableEndpoint, caretPosition);
            }
        });
    }

    saveEndpoint(){
        const {method, updateEntity} = this.props;
        method.setRequestEndpoint(this.state.contentEditableValue);
        updateEntity();
    }

    limitEndpointInputOnKeyPress(e){
        let {contentEditableValue, caretPosition} = this.state;
        const requiredInvokerData = this.props.connector.invoker.data;
        if(CEndpoint.isCaretPositionFocusedOnReference(caretPosition, contentEditableValue, requiredInvokerData) || PROHIBITED_ENDPOINT_CHARACTERS.indexOf(e.key) !== -1){
            e.preventDefault();
        }
    }

    addParam(param){
        let {contentEditableValue, caretPosition} = this.state;
        let endpointDiv = this.getEndpointHtmlElement();
        let newCaretPosition = 0;
        let hasNewCaretPosition = false;
        const requiredInvokerData = this.props.connector.invoker.data;
        if(caretPosition === -1 || caretPosition === 0 && contentEditableValue === ''){
            contentEditableValue = `${contentEditableValue}{%${param}%}`;
        } else{
            const dividedByReferences = CEndpoint.divideEndpointValueByReferences(contentEditableValue, requiredInvokerData);
            let action = {index: -1, name: '', position: 0}
            for(let i = 0; i < dividedByReferences.length; i++){
                let iterableElem = dividedByReferences[i];
                if(iterableElem.isLocalReference){
                    let localReference = iterableElem.value.split('.');
                    localReference = localReference.splice(3).join('.');
                    localReference = localReference.substring(0, localReference.length - 2);
                    caretPosition -= localReference.length;
                    if(!hasNewCaretPosition){
                        newCaretPosition += localReference.length;
                    }
                    if(caretPosition <= 0){
                        action.index = i;
                        action.name = 'replace';
                        newCaretPosition -= localReference.length
                        hasNewCaretPosition = true;
                        break;
                    }
                } else if(iterableElem.isInvokerReference){
                    caretPosition -= (iterableElem.value.length - 2);
                    if(!hasNewCaretPosition){
                        newCaretPosition += (iterableElem.value.length - 2);
                    }
                    if(caretPosition <= 0){
                        action.index = i;
                        action.name = 'replace';
                        newCaretPosition -= (iterableElem.value.length - 2);
                        hasNewCaretPosition = true;
                        break;
                    }
                } else{
                    caretPosition -= iterableElem.value.length;
                    if(!hasNewCaretPosition){
                        newCaretPosition += iterableElem.value.length;
                    }
                    if(caretPosition <= 0){
                        action.index = i;
                        action.name = 'put';
                        action.position = caretPosition + iterableElem.value.length;
                        newCaretPosition = newCaretPosition - iterableElem.value.length + action.position;
                        hasNewCaretPosition = true;
                        break;
                    }
                }
            }
            switch(action.name){
                case 'put':
                    if(dividedByReferences[action.index].value.length === action.position){
                        dividedByReferences.splice(action.index + 1, 0, {value: `{%${param}%}`});
                    } else{
                        dividedByReferences[action.index].value = `${dividedByReferences[action.index].value.substr(0, action.position)}{%${param}%}${dividedByReferences[action.index].value.substr(action.position)}`;
                    }
                    break;
                case 'after':
                    dividedByReferences.splice(action.index, 0, {value: `{%${param}%}`});
                    break;
                case 'replace':
                    dividedByReferences[action.index].value = `{%${param}%}`;
                    break;
            }
            contentEditableValue = dividedByReferences.map(ref => ref.value).join('');
        }
        if(hasNewCaretPosition){
            newCaretPosition += param.split('.').slice(3).join('.').length;
        }
        this.setState({
            contentEditableValue,
            caretPosition: newCaretPosition,
        }, () => {
            setFocusByCaretPositionInDivEditable(endpointDiv, newCaretPosition);
            this.saveEndpoint();
        })
        this.hasAdded = true;
    }

    render(){
        const {connection, connector, method, readOnly, theme, isParamGeneratorArrowVisible, isParamGeneratorAlwaysVisible, updateEntity} = this.props;
        const {contentEditableValue, actionButtonTooltip, actionButtonValue, caretPosition} = this.state;
        let hasError = false;
        if(method.error.hasError){
            if(method.error.location === 'query'){
                hasError = true;
            }
        }
        let contentEditableStyles = {color: hasError ? 'red' : 'black'};
        let htmlValue = renderToString(<QueryString query={contentEditableValue} connector={connector} caretPosition={caretPosition}/>);
        let themeQueryInput = '';
        if(theme && theme.hasOwnProperty('queryInput')){
            themeQueryInput = theme.queryInput;
        }
        return (
            <div>
                <ToolboxThemeInput className={themeQueryInput} label={'Query'} labelClassName={hasError ? styles.method_endpoint_label_has_error : ''}>
                    <ContentEditable
                        id={this.getEndpointIdName()}
                        innerRef={this.endpointValue}
                        html={htmlValue}
                        disabled={readOnly}
                        onChange={(a) => this.onChangeEndpoint(a)}
                        onMouseDown={(a) => this.setCaretPosition(a)}
                        onMouseUp={(a) => this.setCaretPosition(a)}
                        onKeyDown={(a) => this.setCaretPosition(a)}
                        onKeyUp={(a) => this.setCaretPosition(a)}
                        onBlur={(a) => this.saveEndpoint(a)}
                        onKeyPress={(a) => this.limitEndpointInputOnKeyPress(a)}
                        className={`${styles.method_endpoint_content_editable}`}
                        style={contentEditableStyles}
                    />
                    <ParamGenerator
                        updateConnection={updateEntity}
                        connection={connection}
                        connector={connector}
                        method={method}
                        addParam={(a) => this.addParam(a)}
                        readOnly={readOnly}
                        actionButtonTooltip={actionButtonTooltip}
                        actionButtonValue={actionButtonValue}
                        theme={theme}
                        isArrowVisible={isParamGeneratorArrowVisible}
                        isAlwaysVisible={isParamGeneratorAlwaysVisible}
                    />
                </ToolboxThemeInput>
            </div>
        );
    }
}

Endpoint.propTypes = {
    method: PropTypes.instanceOf(CMethodItem).isRequired,
    readOnly: PropTypes.bool,
};

Endpoint.defaultProps = {
    readOnly: false,
    theme: null,
    isParamGeneratorArrowVisible: true,
    isParamGeneratorAlwaysVisible: false,
};

export default Endpoint;