import React, {FC, useEffect} from 'react';
import {withTheme} from 'styled-components';
import { ListRowProps } from './interfaces';
import {ListProp} from "@interface/application/IListCollection";
import {isArray, isString} from "../../utils";
import Text from "@atom/text/Text";

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
                                <td key={propertyKey} title={completeValue}>
                                    <Text value={entityValue}/>
                                </td>
                            )
                        }
                    })
                }
                {collection.hasActions &&
                <td>
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