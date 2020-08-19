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
import theme from "react-toolbox/lib/input/theme.css";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import TooltipText from "@basic_components/tooltips/TooltipText";
import ParamGenerator from "./ParamGenerator";
import Input from "@basic_components/inputs/Input";
import {setFocusById} from "@utils/app";


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
        this.affixValue = React.createRef();
        this.hasAdded = false;
        this.state = {
            isEndpointEditOpen: false,
            endpointEditValue: props.method.request ? props.method.request.query : '',
        };
    }

    openEndpointEdit(){
        const {method} = this.props;
        this.setState({isEndpointEditOpen: true});
    }

    closeEndpointEdit(){
        this.setState({isEndpointEditOpen: false});
    }

    onChangeEndpointEditValue(endpointEditValue){
        this.setState({
            endpointEditValue,
        });
    }

    onChangeEndpoint(e){
        const value = e.target.value;
        const {method, updateEntity} = this.props;
        let result = '';
        let elements = value.split('</span>');
        for(let i = 0; i < elements.length; i++){
            if(elements[i] !== ''){
                let index = elements[i].indexOf('>');
                if(elements[i].indexOf('data-value="param"') === -1) {
                    result += elements[i].substring(index + 1, elements[i].length);
                } else{
                    let param = elements[i].split('data-main="')[1].split('"')[0];
                    let paramName = param.split('.').slice(3).join('.').slice(0, -2);
                    let checkParamName = elements[i].substring(elements[i].indexOf('>') + 1);
                    if(checkParamName.indexOf(paramName) === 0){
                        result += param;
                        if(checkParamName.length > paramName.length){
                            result += checkParamName.substring(paramName.length);
                        }
                    }
                }
            }
        }
        method.setRequestEndpointAffix(result);
        updateEntity();
    }

    componentDidUpdate(){
        const {method} = this.props;
        if(this.hasAdded){
            this.hasAdded = false;
            let el = document.getElementById(`endpoint_${method.index}`);
            this.setFocusToTheEnd(el);
        }
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

    saveEndpointValue(){
        const {endpointEditValue} = this.state;
        const {method, updateEntity} = this.props;
        method.request.query = endpointEditValue;
        updateEntity();
        this.closeEndpointEdit();
    }

    addParam(param){
        const {method, updateEntity} = this.props;
        method.setRequestEndpointAffix(`${method.request.affix}{%${param}%} `);
        updateEntity();
        this.hasAdded = true;
    }

    parseEndpoint(){
        const {method} = this.props;
        let affix = method.request.affix;
        let params = affix.split('{%');
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
                        let index = affix.indexOf(params[i]);
                        let substring = affix.substring(0, index - 2);
                        affix = affix.substring(index + params[i].length, affix.length - 1);
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
            result = affix;
        }
        if(result !== '') {
            return `${result}`;
        } else{
            return '';
        }
    }

    renderEndpointEdit(){
        const {endpointEditValue} = this.state;
        const {method} = this.props;
        return (
            <Input className={styles.endpoint_edit} autoFocus id={`${method.index}_endpoint`} value={endpointEditValue} onChange={::this.onChangeEndpointEditValue} onBlur={::this.saveEndpointValue}/>
        );
    }

    render(){
        const {isEndpointEditOpen} = this.state;
        const {authUser, connection, connector, method, readOnly} = this.props;
        const endpoint = method.request ? method.request.query : '';
        let hasError = false;
        if(method.error.hasError){
            if(method.error.location === 'query'){
                hasError = true;
            }
        }
        let depth = method.getDepth();
        let tooltipTextStyles = {width: depth < 4 ? '10%' : depth < 6 ? '12%' : depth < 8 ? '15%' : '18%' };
        let contentEditableStyles = {width: depth < 4 ? '85%' : depth < 6 ? '83%' : depth < 8 ? '80%' : '77%', overflow: 'hidden', whiteSpace: 'nowrap', height: '41px', color: hasError ? 'red' : 'black'};
        return (
            <div>
                <div className={`${theme.input}`}>
                    <span className={styles.method_affix}>
                        <TooltipText
                            authUser={authUser}
                            tooltip={endpoint}
                            text={'[...]'}
                            className={styles.method_affix_placeholder}
                            style={hasError ? {...tooltipTextStyles, color: 'red'} : tooltipTextStyles}
                            onClick={::this.openEndpointEdit}
                        />
                        {
                            isEndpointEditOpen && !readOnly && this.renderEndpointEdit()
                        }
                    </span>
                    <div
                        className={`${theme.inputElement} ${theme.filled}`}
                        style={{width: '5%', float: 'left', paddingLeft: '3px', color: hasError ? 'red' : 'black'}}>
                        {`/ `}
                    </div>
                    <ContentEditable
                        id={`endpoint_${method.index}`}
                        innerRef={this.affixValue}
                        html={::this.parseEndpoint()}
                        disabled={readOnly}
                        onChange={::this.onChangeEndpoint}
                        className={`${theme.inputElement} ${theme.filled}`}
                        style={contentEditableStyles}
                    />
                    <ParamGenerator
                        connection={connection}
                        connector={connector}
                        method={method}
                        addParam={::this.addParam}
                        readOnly={readOnly}
                    />
                    <span className={theme.bar}/>
                    <label className={theme.label} style={hasError ? {color: 'red'} : {}}>{'Query'}</label>
                </div>
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