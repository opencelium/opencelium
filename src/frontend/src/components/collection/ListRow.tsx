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

import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import {ListProp} from "@application/interfaces/IListCollection";
import {isArray, isString} from "@application/utils/utils";
import Text from "@app_component/base/text/Text";
import { ListRowProps } from './interfaces';

const MAX_COLUMN_VALUE_LENGTH = 150;

const ListRow: FC<ListRowProps> =
    ({
        actionsData,
        isChecked,
        entity,
        collection,
        check,
        checks,
    }) => {
        return (
            <tr>
                {collection.hasCheckboxes &&
                <td>
                    <input type={'checkbox'} checked={isChecked} onChange={() => check({
                        value: entity[collection.keyPropName],
                        isChecked: !checks[entity[collection.keyPropName]]
                    })}/>
                </td>
                }
                {
                    collection.listProps.map((listProp: ListProp) => {
                        const propertyKey = listProp.propertyKey;
                        const getValue = listProp.getValue;
                        const shouldReplace = listProp.replace || false;
                        const cellStyle = listProp.style || {};
                        if (propertyKey !== '') {
                            let entityValue: any = '';
                            if(getValue){
                                entityValue = getValue(entity);
                            } else{
                                const splitColumnName = propertyKey.split('.');
                                if (splitColumnName.length > 0) {
                                    for (let i = 0; i < splitColumnName.length; i++) {
                                        let isNextParamArray = splitColumnName[i].includes('[');
                                        if (isNextParamArray) {
                                            let mapName = splitColumnName[i].substring(splitColumnName[i].indexOf('[') + 1, splitColumnName[i].indexOf(']'));
                                            let paramName = splitColumnName[i].substr(0, splitColumnName[i].indexOf('['));
                                            if (entityValue === '') {
                                                entityValue = entity[paramName].map((elem: any) => elem[mapName]);
                                            } else {
                                                entityValue = entityValue[paramName].map((elem: any) => elem[mapName]);
                                            }
                                        } else {
                                            if (entityValue === '') {
                                                entityValue = entity[splitColumnName[i]];
                                            } else {
                                                entityValue = entityValue[splitColumnName[i]];
                                            }
                                        }
                                    }
                                }
                                if (isArray(entityValue)) {
                                    entityValue = entityValue.join(', ')
                                }
                            }
                            const completeValue = isString(entityValue) ? entityValue : '';
                            if(isString(entityValue)){
                                if(entityValue.length > MAX_COLUMN_VALUE_LENGTH){
                                    entityValue = `${entityValue.substring(0, MAX_COLUMN_VALUE_LENGTH)}...`;
                                }
                            }
                            if(shouldReplace){
                                return entityValue;
                            }
                            return (
                                <td key={propertyKey} title={completeValue} style={cellStyle}>
                                    <Text value={entityValue}/>
                                </td>
                            )
                        }
                    })
                }
                {collection.hasActions &&
                <td style={{whiteSpace: 'nowrap'}}>
                    {actionsData}
                </td>
                }
            </tr>
        )
}

ListRow.defaultProps = {
}


export {
    ListRow,
};

export default withTheme(ListRow);