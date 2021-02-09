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
import {
    InvokerReference,
    InvokerReferenceFromRequiredData, LocalReference
} from "@change_component/form_elements/form_connection/form_methods/method/query_string/SpanReferences";
import CEndpoint from "@classes/components/general/change_component/form_elements/CEndpoint";


const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];

function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
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
        }
    }

    onChangeEndpoint(e){
        const {caretPosition, contentEditableValue, currentKeyCode} = this.state;
        const {method} = this.props;
        let endpointDiv = document.getElementById(`endpoint_${method.index}`);
        const value = e.target.value;
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
                        } else{
                            let hasLastSymbolSpace = !parsedValue[parsedValue.length - 1].trim();
                            if(hasLastSymbolSpace){
                                result += `{${parsedValue.substr(0, parsedValue.length - 1)}} `;
                            } else {
                                result += `{${parsedValue}}`;
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
                        }
                    }
                }
            }
            const beforeValue = this.freeStringFromReferences(contentEditableValue);
            const afterValue = this.freeStringFromReferences(result);
            const caretDifference = beforeValue.length - afterValue.length;
            const isRemovedReference = beforeValue.length - afterValue.length > 1;
            const isRemovedCharacter = beforeValue.length - afterValue.length === 1;
            const isAddedCharacter = afterValue.length - beforeValue.length === 1;
            this.setState({
                contentEditableValue: result,
            }, () => {
                if(isRemovedReference) {
                    //if user clicked on the delete
                    let newCaretPosition = caretPosition;
                    //if user clicked on the backspace
                    if(currentKeyCode === 8) {
                        newCaretPosition = caretPosition - caretDifference;
                    }
                    setFocusByCaretPositionInDivEditable(endpointDiv, newCaretPosition);
                }
                if(isAddedCharacter){
                    setFocusByCaretPositionInDivEditable(endpointDiv, caretPosition + 1);
                }
                if(isRemovedCharacter){
                    //if user clicked on the delete
                    let newCaretPosition = caretPosition;
                    //if user clicked on the backspace
                    if(currentKeyCode === 8) {
                        newCaretPosition = caretPosition - 1;
                    }
                    setFocusByCaretPositionInDivEditable(endpointDiv, newCaretPosition);
                }
            });
        }
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
        let {currentKeyCode} = this.state;
        const {method} = this.props;
        let editableEndpoint = document.getElementById(`endpoint_${method.index}`);
        let caretPosition = getCaretPositionOfDivEditable(editableEndpoint);
        if(e.keyCode){
            currentKeyCode = e.keyCode;
        }
        this.setState({
            caretPosition,
            currentKeyCode,
        });
    }

    saveEndpoint(){
        const {method, updateEntity} = this.props;
        method.setRequestEndpoint(this.state.contentEditableValue);
        updateEntity();
    }

    limitEndpointInput(e){
        let {contentEditableValue, caretPosition} = this.state;
        if(CEndpoint.isChangingReference(caretPosition, contentEditableValue) || PROHIBITED_ENDPOINT_CHARACTERS.indexOf(e.key) !== -1){
            e.preventDefault();
        }
    }

    addParam(param){
        let {contentEditableValue, caretPosition} = this.state;
        const requiredInvokerData = this.props.connector.invoker.data;
        if(caretPosition === -1){
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
                    if(caretPosition < 0){
                        action.index = i;
                        action.name = 'replace';
                        break;
                    }
                } else if(iterableElem.isInvokerReference){
                    caretPosition -= (iterableElem.value.length - 2);
                    if(caretPosition < 0){
                        action.index = i;
                        action.name = 'replace';
                        break;
                    }
                } else{
                    caretPosition -= iterableElem.value.length;
                    if(caretPosition < 0){
                        action.index = i;
                        action.name = 'put';
                        action.position = caretPosition + iterableElem.value.length;
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
        this.setState({
            contentEditableValue,
        })
        this.hasAdded = true;
    }



    render(){
        const {connection, connector, method, readOnly} = this.props;
        const {contentEditableValue} = this.state;
        let hasError = false;
        if(method.error.hasError){
            if(method.error.location === 'query'){
                hasError = true;
            }
        }
        let contentEditableStyles = {color: hasError ? 'red' : 'black'};
        let htmlValue = renderToString(<QueryString query={contentEditableValue} connector={connector}/>);
        return (
            <div>
                <ToolboxThemeInput label={'Query'} labelClassName={hasError ? styles.method_endpoint_label_has_error : ''}>
                    <ContentEditable
                        id={`endpoint_${method.index}`}
                        innerRef={this.endpointValue}
                        html={htmlValue}
                        disabled={readOnly}
                        onChange={::this.onChangeEndpoint}
                        onMouseDown={::this.setCaretPosition}
                        onMouseUp={::this.setCaretPosition}
                        onKeyDown={::this.setCaretPosition}
                        onKeyUp={::this.setCaretPosition}
                        onBlur={::this.saveEndpoint}
                        onKeyPress={::this.limitEndpointInput}
                        className={`${styles.method_endpoint_content_editable}`}
                        style={contentEditableStyles}
                    />
                    <ParamGenerator
                        connection={connection}
                        connector={connector}
                        method={method}
                        addParam={::this.addParam}
                        readOnly={readOnly}
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
};

export default Endpoint;