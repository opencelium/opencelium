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
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import ContentEditable from 'react-contenteditable';

import styles from '@themes/default/general/form_methods.scss';
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import ParamGenerator from "./ParamGenerator";
import ToolboxThemeInput from "../../../../../../../hocs/ToolboxThemeInput";
import {freeStringFromAmp, getCaretPositionOfDivEditable, setFocusByCaretPositionInDivEditable} from "@utils/app";


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
        }
    }

    onChangeEndpoint(e){
        const {caretPosition, contentEditableValue} = this.state;
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
                        result += freeStringFromAmp(elements[i].substring(index + 1, elements[i].length));
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
                    setFocusByCaretPositionInDivEditable(endpointDiv, caretPosition - caretDifference);
                }
                if(isAddedCharacter){
                    setFocusByCaretPositionInDivEditable(endpointDiv, caretPosition + 1);
                }
                if(isRemovedCharacter){
                    setFocusByCaretPositionInDivEditable(endpointDiv, caretPosition - 1);
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

    setCaretPosition(){
        const {method} = this.props;
        let editableEndpoint = document.getElementById(`endpoint_${method.index}`);
        let caretPosition = getCaretPositionOfDivEditable(editableEndpoint);
        this.setState({
            caretPosition,
        });
    }

    saveEndpoint(){
        const {method, updateEntity} = this.props;
        method.setRequestEndpoint(this.state.contentEditableValue);
        updateEntity();
    }

    setFocusToTheEnd(el) {
        el.focus();
        if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
            let range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (typeof document.body.createTextRange != "undefined") {
            let textRange = document.body.createTextRange();
            textRange.moveToElementText(el);
            textRange.collapse(false);
            textRange.select();
        }
    }

    addParam(param){
        let {contentEditableValue, caretPosition} = this.state;
        if(caretPosition === -1){
            contentEditableValue = `${contentEditableValue}{%${param}%}`;
        } else{
            let stringsWithStartReferences = contentEditableValue.split('{%#');
            if(stringsWithStartReferences.length === 1){
                contentEditableValue = `${contentEditableValue.substr(0, caretPosition)}{%${param}%}${contentEditableValue.substr(caretPosition)}`;
            } else{
                let valueDividedByReferences = [];
                for(let i = 0; i < stringsWithStartReferences.length; i++){
                    let stringsWithEndReferences = stringsWithStartReferences[i].split('%}');
                    if(stringsWithEndReferences.length > 0) {
                        if (stringsWithEndReferences.length === 1) {
                            if (stringsWithEndReferences[0] !== '') {
                                valueDividedByReferences.push({isReference: false, value: stringsWithEndReferences[0]});
                            }
                        } else {
                            valueDividedByReferences.push({isReference: true, value:`{%#${stringsWithEndReferences[0]}%}`});
                            if(stringsWithEndReferences[1] !== '') {
                                valueDividedByReferences.push({isReference: false, value: stringsWithEndReferences[1]});
                            }
                        }
                    }
                }
                let valueIndex = 0;
                for(let i = 0; i < valueDividedByReferences.length; i++){
                    if(valueDividedByReferences[i].isReference) {
                        let reference = valueDividedByReferences[i].value.split('.');
                        reference = reference.splice(3).join('.');
                        reference = reference.substring(0, reference.length - 2);
                        caretPosition -= reference.length;
                        if(caretPosition < 0){
                            caretPosition = reference + caretPosition + 3;
                            break;
                        }
                    } else{
                        caretPosition -= valueDividedByReferences[i].value.length;
                        if(caretPosition < 0){
                            caretPosition = valueDividedByReferences[i].value.length + caretPosition;
                            break;
                        }
                    }
                    valueIndex++;
                }
                valueDividedByReferences[valueIndex].value = `${valueDividedByReferences[valueIndex].value.substr(0, caretPosition)}{%${param}%}${valueDividedByReferences[valueIndex].value.substr(caretPosition)}`
                contentEditableValue = valueDividedByReferences.map(elem => elem.value).join('');
            }
        }
        this.setState({
            contentEditableValue,
        })
        this.hasAdded = true;
    }

    parseEndpoint(endpoint){
        let params = endpoint.split('{%');
        let isParams = [];
        let result = '';
        if(params.length > 1) {
            for (let i = 1; i < params.length; i++) {
                let paramEndIndex = params[i].indexOf('%}');
                if(paramEndIndex !== -1) {
                    let afterParam = params[i].substring(paramEndIndex + 2, params[i].length);
                    params[i] = params[i].substring(0, paramEndIndex);
                    isParams.push(i);
                    if(afterParam !== ''){
                        params.splice(i + 1, 0, afterParam);
                        i++;
                    }
                }
            }
            for(let i = 0; i < params.length; i++){
                if(params[i] !== '' && params[i] !== ' ') {
                    if (isParams.indexOf(i) !== -1) {
                        let index = endpoint.indexOf(params[i]);
                        let substring = endpoint.substring(0, index - 2);
                        endpoint = endpoint.substring(index + params[i].length, endpoint.length - 1);
                        let pArray = params[i].split('.');
                        let color = pArray[0];
                        let fieldName = pArray.slice(3, pArray.length).join('.');
                        if ((substring !== ' ' && fieldName !== '') || (params.length === 3 && params[0] === ' ' && params[2] === ' ')) {
                            result += `<span style="background:${color}; width:20px; padding: 3px; border-radius: 1px 3px; margin: 3px;" data-value="param" data-main="{%${params[i]}%}">${fieldName}</span>`;
                        }
                    } else {
                        result += `<span>${params[i]}</span>`;
                    }
                }
            }
        } else{
            result = endpoint;
        }
        if(result !== '') {
            return `${result}`;
        } else{
            return '';
        }
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
        return (
            <div>
                <ToolboxThemeInput label={'Query'} labelClassName={hasError ? styles.method_endpoint_label_has_error : ''}>
                    <ContentEditable
                        id={`endpoint_${method.index}`}
                        innerRef={this.endpointValue}
                        html={::this.parseEndpoint(contentEditableValue)}
                        disabled={readOnly}
                        onChange={::this.onChangeEndpoint}
                        onMouseDown={::this.setCaretPosition}
                        onMouseUp={::this.setCaretPosition}
                        onKeyDown={::this.setCaretPosition}
                        onKeyUp={::this.setCaretPosition}
                        onBlur={::this.saveEndpoint}
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