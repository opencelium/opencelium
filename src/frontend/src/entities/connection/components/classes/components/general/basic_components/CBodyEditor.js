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

import { isNumber, isString, wrapField } from "@application/utils/utils";
import {
    convertFieldNameForBackend,
    markFieldNameAsArray
} from "@change_component//form_elements/form_connection/form_methods/help";
import { CONNECTOR_TO } from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CBindingItem from "@entity/connection/components/classes/components/content/connection/field_binding/CBindingItem";
import { STATEMENT_REQUEST, STATEMENT_RESPONSE } from "@entity/connection/components/classes/components/content/connection/operator/CStatement";
import { RESPONSE_FAIL, RESPONSE_SUCCESS } from "@entity/connection/components/classes/components/content/invoker/response/CResponse";

export class CBodyEditor{

    static getParsedReferences(value = '') {
        const references = CBodyEditor.splitReferences(value);
        const result = [];

        for (let i = 0; i < references.length; i++) {
            const parsed = CBodyEditor.parseReference(references[i]);
            if (parsed) {
                result.push(parsed);
            }
        }

        return result;
    }

    static splitReferences(value = '') {
        return String(value || '')
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    static parseReference(reference = '') {
        const normalized = String(reference || '')
            .trim()
            .replace(/^\{\%\s*/, '')
            .replace(/\s*\%\}$/, '');

        const match = normalized.match(
            /^(#[A-Fa-f0-9]{6})\.\((request|response)\)\.(header|body|status)(?:\.(.*))?$/
        );

        if (!match) {
            return null;
        }

        const [, color, type, location, tail = ''] = match;

        let field = location;
        if (location !== 'status') {
            field = tail ? `${location}.${tail}` : `${location}.$`;
        }

        return {
            color,
            type,
            location,
            field,
        };
    }

    static updateFieldsBinding(connection, connector, method, bodyData, target = null, refStructure) {
        const checkBodyData = CBodyEditor.shouldUpdateFieldBinding(connector, bodyData);
        const invokerBody = method.request.invokerBody;

        if (checkBodyData !== 0) {
            const parents = Array.isArray(bodyData.namespaces) ? bodyData.namespaces : [];
            const newValue = bodyData.newValue;
            const currentItem = connector.getCurrentItem();
            const item = {};

            item.color = currentItem.color;

            if (parents.length === 0) {
                item.field = bodyData.name;
            } else {
                item.field = `${parents.join('.')}.${bodyData.name}`;
            }

            item.field = convertFieldNameForBackend(invokerBody.fields, item.field, true);

            if (target === 'header') {
                item.field = `header.$.${item.field.replace(/^body\.\$\.|header\.\$\./, '')}`;
            } else {
                item.field = `body.$.${item.field.replace(/^body\.\$\.|header\.\$\./, '')}`;
            }

            item.type = 'request';

            if (refStructure && refStructure.request) {
                item.field = wrapField(item.field, refStructure.request);
            }

            const toBindingItems = [CBindingItem.createBindingItem(item)];
            const fromBindingItems = [];

            if (checkBodyData === 1) {
                const parsedReferences = CBodyEditor.getParsedReferences(newValue);

                for (let i = 0; i < parsedReferences.length; i++) {
                    const parsed = parsedReferences[i];

                    const newItem = {
                        color: parsed.color,
                        type: parsed.type,
                        field: parsed.field,
                    };

                    if (refStructure && refStructure.response && parsed.location !== 'status') {
                        newItem.field = wrapField(newItem.field, refStructure.response);
                    }

                    fromBindingItems.push(CBindingItem.createBindingItem(newItem));
                }
            }

            connection.updateFieldBinding(
                connector.getConnectorType(),
                {
                    from: fromBindingItems,
                    to: toBindingItems,
                }
            );
        }

        CBodyEditor.cleanFieldBinding(connection, bodyData);
    }


    static cleanFieldBinding(connection, bodyData) {
        if (bodyData.newValue === '' || typeof bodyData.newValue === 'undefined') {
            if (isString(bodyData.existingValue)) {
                const existingParsedReferences = CBodyEditor.getParsedReferences(bodyData.existingValue);

                if (existingParsedReferences.length > 0) {
                    const parents = bodyData.namespaces;
                    const currentItem = connection.toConnector.getCurrentItem();
                    const item = {};

                    if (currentItem) {
                        item.color = currentItem.color;

                        if (parents.length === 0) {
                            item.field = bodyData.name;
                        } else {
                            item.field = '';

                            for (let i = 0; i < parents.length; i++) {
                                if (i < parents.length - 1) {
                                    if (isNumber(parseInt(parents[i + 1]))) {
                                        item.field += markFieldNameAsArray(parents[i], parents[i + 1]);
                                        i++;
                                    } else {
                                        item.field += `${parents[i]}`;
                                    }
                                } else {
                                    item.field += `${parents[i]}`;
                                }

                                item.field += '.';
                            }

                            item.field += bodyData.name;
                        }

                        item.type = 'request';

                        connection.cleanFieldBinding(CONNECTOR_TO, {
                            to: [CBindingItem.createBindingItem(item)],
                        });
                    }
                }
            }
        }
    }
    //2 - clear; 1 - update; 0 - not update
    static shouldUpdateFieldBinding(connector, bodyData) {
        let result = 0;

        if (
            bodyData &&
            bodyData.hasOwnProperty('namespaces') &&
            bodyData.hasOwnProperty('name') &&
            bodyData.hasOwnProperty('newValue')
        ) {
            if (isString(bodyData.existingValue)) {
                const existingParsedReferences = CBodyEditor.getParsedReferences(bodyData.existingValue);

                if (existingParsedReferences.length > 0) {
                    result = 2;
                }
            }

            if (isString(bodyData.newValue)) {
                const newParsedReferences = CBodyEditor.getParsedReferences(bodyData.newValue);

                if (newParsedReferences.length > 0) {
                    result = 1;
                }
            } else {
                result = 0;
            }
        }

        return result;
    }
}
