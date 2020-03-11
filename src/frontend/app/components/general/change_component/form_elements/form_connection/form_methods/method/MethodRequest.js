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
import styles from '../../../../../../../themes/default/general/form_methods.scss';
import {consoleLog, isString} from "../../../../../../../utils/app";
import CMethodItem from "../../../../../../../classes/components/content/connection/method/CMethodItem";

import theme from "react-toolbox/lib/input/theme.css";
import {
    STATEMENT_REQUEST,
    STATEMENT_RESPONSE
} from "../../../../../../../classes/components/content/connection/operator/CStatement";
import {
    RESPONSE_FAIL,
    RESPONSE_SUCCESS
} from "../../../../../../../classes/components/content/invoker/response/CResponse";
import {CONNECTOR_TO} from "../../../../../../../classes/components/content/connection/CConnectorItem";
import CBindingItem from "../../../../../../../classes/components/content/connection/field_binding/CBindingItem";
import CardText from "../../../../../basic_components/card/CardText";
import Endpoint from "./Endpoint";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import CConnectorItem from "../../../../../../../classes/components/content/connection/CConnectorItem";
import {convertFieldNameForBackend} from "../utils";
import Body from "./Body";


class MethodRequest extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        let that = this;
        const {id} = that.props;
        setTimeout(function(){
            const elem = document.getElementById(id);
            if(elem) {
                elem.classList.remove(styles.item_card_text);
                elem.classList.add(styles.item_card_text_show);
                setTimeout(() => {
                    elem.style.overflow = 'visible';
                }, 500);
            }
        }, 200);
    }

    //2 - clear; 1 - update; 0 - not update
    shouldUpdateFieldBinding(reactJson){
        const {connector} = this.props;
        let result = 0;
        if(connector.getConnectorType() === CONNECTOR_TO && reactJson.hasOwnProperty('namespace')
            && reactJson.hasOwnProperty('name')
            && reactJson.hasOwnProperty('new_value')){
            if(isString(reactJson.existing_value)) {
                let existingValueSplitted = reactJson.existing_value.split('.');
                if (existingValueSplitted.length > 3) {
                    if (existingValueSplitted[1] === `(${STATEMENT_REQUEST})`
                        || existingValueSplitted[1] === `(${STATEMENT_RESPONSE})`) {
                        if (existingValueSplitted[2] === RESPONSE_SUCCESS
                            || existingValueSplitted[2] === RESPONSE_FAIL) {
                            result = 2;
                        }
                    }
                }
            }
            if(isString(reactJson.new_value)) {
                let newValueSplitted = reactJson.new_value.split('.');
                if (newValueSplitted.length > 3) {
                    if (newValueSplitted[1] === `(${STATEMENT_REQUEST})`
                        || newValueSplitted[1] === `(${STATEMENT_RESPONSE})`) {
                        if (newValueSplitted[2] === RESPONSE_SUCCESS
                            || newValueSplitted[2] === RESPONSE_FAIL) {
                            result = 1;
                        }
                    }
                }
            } else{
                result = 0;
            }
        } else{
            consoleLog('Type json should be reworked to do mapping');
        }
        return result;
    }

    parseFieldOnArrays(field){
        const {method} = this.props;
        let invokerBody = method.request.invokerBody;
        return convertFieldNameForBackend(invokerBody, field, true);
    }

    updateFieldBinding(reactJson){
        const checkReactJson = this.shouldUpdateFieldBinding(reactJson);
        if(checkReactJson !== 0){
            const {connection} = this.props;
            let parents = reactJson.namespace;
            let newValue = reactJson.new_value;
            let currentItem = connection.toConnector.getCurrentItem();
            let item = {};
            item.color = currentItem.color;
            if(parents.length === 0){
                item.field = reactJson.name;
            } else {
                item.field = `${parents.join('.')}.${reactJson.name}`;
            }
            item.field = this.parseFieldOnArrays(item.field);
            item.type = 'request';
            let toBindingItems = [CBindingItem.createBindingItem(item)];
            let fromBindingItems = [];
            switch(checkReactJson) {
                case 1:
                    let newValueSplitted = newValue.split(';');
                    for (let i = 0; i < newValueSplitted.length; i++) {
                        let bindingItemSplitted = newValueSplitted[i].split('.');
                        let newItem = {};
                        newItem.color = bindingItemSplitted[0];
                        newItem.type = bindingItemSplitted[1].substr(1, bindingItemSplitted[1].length - 2);
                        newItem.field = bindingItemSplitted.slice(2, bindingItemSplitted.length).join('.');
                        fromBindingItems.push(CBindingItem.createBindingItem(newItem));
                    }
                    break;
                case 2:
                    break;
            }
            connection.updateFieldBinding(CONNECTOR_TO, {from: fromBindingItems, to: toBindingItems});
        }
    }

    cleanFieldBinding(reactJson){
        if(reactJson.new_value === '' || typeof reactJson.new_value === 'undefined') {
            if (isString(reactJson.existing_value)) {
                let existingValueSplitted = reactJson.existing_value.split('.');
                if (existingValueSplitted.length > 3) {
                    if (existingValueSplitted[1] === `(${STATEMENT_REQUEST})`
                        || existingValueSplitted[1] === `(${STATEMENT_RESPONSE})`) {
                        if (existingValueSplitted[2] === RESPONSE_SUCCESS
                            || existingValueSplitted[2] === RESPONSE_FAIL) {
                            const {connection} = this.props;
                            let parents = reactJson.namespace;
                            let currentItem = connection.toConnector.getCurrentItem();
                            let item = {};
                            if(currentItem) {
                                item.color = currentItem.color;
                                if (parents.length === 0) {
                                    item.field = reactJson.name;
                                } else {
                                    item.field = `${parents.join('.')}.${reactJson.name}`;
                                }
                                item.type = 'request';
                                connection.cleanFieldBinding(CONNECTOR_TO, {to: [CBindingItem.createBindingItem(item)]});
                            }
                        }
                    }
                }
            }
        }
    }

    updateBody(reactJson){
        const {method, updateEntity} = this.props;
        let body = reactJson.updated_src;
        this.setCurrentItem();
        this.updateFieldBinding(reactJson);
        this.cleanFieldBinding(reactJson);
        method.setRequestBody(body);
        updateEntity();
    }

    /**
     * to set current item
     */
    setCurrentItem(){
        const {connector, method, updateEntity} = this.props;
        connector.setCurrentItem(method);
        updateEntity();
    }

    render(){
        const {id, readOnly, method, connector, connection, updateEntity} = this.props;
        let bodyHasError = false;
        if(method.error.hasError){
            if(method.error.location === 'body'){
                bodyHasError = true;
            }
        }
        return (
            <div id={id} className={styles.item_card_text}>
                <CardText>
                    <div className={styles.method_param}>
                        <Endpoint
                            method={method}
                            connector={connector}
                            connection={connection}
                            readOnly={readOnly}
                            setCurrentItem={::this.setCurrentItem}
                            updateEntity={updateEntity}
                        />
                        <label className={`${theme.label} ${styles.body_label}`} style={bodyHasError ? {color: 'red'} : {}}>{'Body'}</label>
                        <Body
                            id={id}
                            readOnly={readOnly}
                            method={method}
                            connection={connection}
                            connector={connector}
                            updateBody={::this.updateBody}
                            updateEntity={updateEntity}
                            setCurrentItem={::this.setCurrentItem}
                        />
                    </div>
                </CardText>
            </div>
        );
    }
}

MethodRequest.propTypes = {
    id: PropTypes.string.isRequired,
    method: PropTypes.instanceOf(CMethodItem).isRequired,
    updateEntity: PropTypes.func.isRequired,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
    readOnly: PropTypes.bool,
};

MethodRequest.defaultProps = {
    readOnly: false,
};

export default MethodRequest;