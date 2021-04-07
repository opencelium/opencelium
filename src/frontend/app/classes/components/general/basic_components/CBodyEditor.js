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

import {convertFieldNameForBackend} from "@change_component/form_elements/form_connection/form_methods/help";
import CBindingItem from "@classes/components/content/connection/field_binding/CBindingItem";
import {CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import {consoleLog, isString} from "@utils/app";
import {STATEMENT_REQUEST, STATEMENT_RESPONSE} from "@classes/components/content/connection/operator/CStatement";
import {RESPONSE_FAIL, RESPONSE_SUCCESS} from "@classes/components/content/invoker/response/CResponse";

export class CBodyEditor{

    static updateFieldsBinding(connection, connector, method, bodyData){
        const checkBodyData = CBodyEditor.shouldUpdateFieldBinding(connector, bodyData);
        let invokerBody = method.request.invokerBody;
        if(checkBodyData !== 0){
            let parents = bodyData.namespaces;
            let newValue = bodyData.newValue;
            let currentItem = connection.toConnector.getCurrentItem();
            let item = {};
            item.color = currentItem.color;
            if(parents.length === 0){
                item.field = bodyData.name;
            } else {
                item.field = `${parents.join('.')}.${bodyData.name}`;
            }
            item.field = convertFieldNameForBackend(invokerBody.fields, item.field, true);
            item.type = 'request';
            let toBindingItems = [CBindingItem.createBindingItem(item)];
            let fromBindingItems = [];
            switch(checkBodyData) {
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
        CBodyEditor.cleanFieldBinding(connection, bodyData);
    }

    static cleanFieldBinding(connection, bodyData){
        if(bodyData.newValue === '' || typeof bodyData.newValue === 'undefined') {
            if (isString(bodyData.existingValue)) {
                let existingValueSplitted = bodyData.existingValue.split('.');
                if (existingValueSplitted.length > 3) {
                    if (existingValueSplitted[1] === `(${STATEMENT_REQUEST})`
                        || existingValueSplitted[1] === `(${STATEMENT_RESPONSE})`) {
                        if (existingValueSplitted[2] === RESPONSE_SUCCESS
                            || existingValueSplitted[2] === RESPONSE_FAIL) {
                            let parents = bodyData.namespaces;
                            let currentItem = connection.toConnector.getCurrentItem();
                            let item = {};
                            if(currentItem) {
                                item.color = currentItem.color;
                                if (parents.length === 0) {
                                    item.field = bodyData.name;
                                } else {
                                    item.field = `${parents.join('.')}.${bodyData.name}`;
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
    //2 - clear; 1 - update; 0 - not update
    static shouldUpdateFieldBinding(connector, bodyData){
        let result = 0;
        if(connector.getConnectorType() === CONNECTOR_TO && bodyData && bodyData.hasOwnProperty('namespaces')
            && bodyData.hasOwnProperty('name')
            && bodyData.hasOwnProperty('newValue')){
            if(isString(bodyData.existingValue)) {
                let existingValueSplitted = bodyData.existingValue.split('.');
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
            if(isString(bodyData.newValue)) {
                let newValueSplitted = bodyData.newValue.split('.');
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
}