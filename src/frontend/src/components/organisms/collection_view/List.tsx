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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {CheckProps, ListViewProps, SortType} from './interfaces';
import {Table} from "@atom/table/Table";
import {capitalize} from "../../../utils";
import Card from "@atom/card/Card";
import Button from "@atom/button/Button";
import {ColorTheme} from "../../general/Theme";
import {EmptyList} from "@molecule/list/EmptyList";
import {ThStyled} from "@organism/collection_view/styles";
import {ListProp} from "@interface/application/IListCollection";
import {ListRow} from "@molecule/list/ListRow";
import {Text} from "@atom/text/Text";


const MAX_COLUMN_VALUE_LENGTH = 150;

const List: FC<ListViewProps> =
    ({
        collection,
        searchValue,
        currentPage,
        entitiesPerPage,
        checks,
        setChecks,
        componentPermission,
        shouldBeUpdated,
        isRefreshing,
    }) => {
    const [sortTypes, setSortTypes] = useState<any>({});
    const [visibleEntities, setVisibleEntities] = useState([]);
    const [isAllChecked, setAllChecked] = useState(false);
    useEffect(() => {
        let newSortTypes: any = {};
        setVisibleEntities(collection.getEntitiesByPage(searchValue, 1, entitiesPerPage));
        for(let i = 0; i < collection.sortingProps.length; i++){
            newSortTypes[collection.sortingProps[i]] = SortType.asc;
        }
        setSortTypes(newSortTypes)
    }, []);
    useEffect(() => {
        let newVisibleEntities = collection.getEntitiesByPage(searchValue, currentPage, entitiesPerPage);
        setVisibleEntities(newVisibleEntities);
        defineIsAllChecked(checks, newVisibleEntities);
    }, [currentPage, searchValue, sortTypes, entitiesPerPage, collection.entities.length, shouldBeUpdated]);
    const toggleCheckAll = (newIsAllChecked: boolean) => {
        let newChecks : any = {};
        for (let i = 0; i < visibleEntities.length; i++) {
            newChecks[visibleEntities[i][collection.keyPropName]] = newIsAllChecked;
        }
        setChecks({...checks, ...newChecks});
        setAllChecked(newIsAllChecked);
    }
    const defineIsAllChecked = (newChecks: any, newVisibleEntities: any[]) => {
        let newIsAllChecked = true;
        if(Object.keys(newChecks).length >= newVisibleEntities.length) {
            for (let i = 0; i < newVisibleEntities.length; i++) {
                let prop = newVisibleEntities[i][collection.keyPropName];
                if (newChecks.hasOwnProperty(prop)) {
                    if (!newChecks[prop]) {
                        newIsAllChecked = false;
                        break;
                    }
                } else {
                    newIsAllChecked = false;
                    break;
                }
            }
        } else{
            newIsAllChecked = false;
        }
        if(newIsAllChecked !== isAllChecked){
            setAllChecked(newIsAllChecked);
        }
    }
    const check = (newCheck: CheckProps) => {
        let newChecks : any = {
            ...checks,
            [newCheck.value]: newCheck.isChecked,
        };
        defineIsAllChecked(newChecks, visibleEntities);
        setChecks(newChecks);
    }
    const sort = (sortingProp: string, sortType: SortType = SortType.asc) => {
        collection.sort(sortingProp, sortType);
        setSortTypes({...sortTypes, [sortingProp]: sortType})
    }
    return (
        <Card padding={'10px'} margin={'0 0 20px 0'} isRefreshing={isRefreshing} overflow={'auto'}>
            {visibleEntities.length === 0
                ?
                <EmptyList/>
                :
                <Table>
                    <thead>
                    <tr>
                        {collection.hasCheckboxes &&
                        <th>
                            <input type={'checkbox'} onChange={() => toggleCheckAll(!isAllChecked)}
                                   checked={isAllChecked}/>
                        </th>
                        }
                        {
                            collection.listProps.map((listProp: ListProp) => {
                                let propertyKey = listProp.propertyKey;
                                let columnWidth = listProp.width || 'auto';
                                if (propertyKey !== '') {
                                    let translationProp = propertyKey;
                                    let splitColumnName = propertyKey.split('.');
                                    if (splitColumnName.length > 1) {
                                        translationProp = splitColumnName.map((name, key) => key !== 0 ? capitalize(name) : name).join('');
                                    }
                                    let hasSortIcon = collection.sortingProps.findIndex(prop => prop === propertyKey) !== -1;
                                    let sortIcon = hasSortIcon ? sortTypes[propertyKey] === SortType.asc ? 'keyboard_arrow_up' : 'keyboard_arrow_down' : '';
                                    return (
                                        <ThStyled key={propertyKey} width={columnWidth}>
                                            <div style={{display: 'flex', justifyContent: 'center'}}>
                                                <span style={{marginLeft: hasSortIcon ? '24px' : 0}}><Text value={collection.translations[translationProp]}/></span>
                                                {hasSortIcon &&
                                                    <Button hasBackground={false} color={ColorTheme.Blue}
                                                            handleClick={() => sort(propertyKey, sortTypes[propertyKey] === SortType.asc ? SortType.desc : SortType.asc)}
                                                            icon={sortIcon} size={24}
                                                    />
                                                }
                                            </div>
                                        </ThStyled>
                                    )
                                }
                            })
                        }
                        {collection.hasActions &&
                        <th>
                            <span>Actions</span>
                        </th>
                        }
                    </tr>
                    </thead>
                    <tbody>
                    {
                        visibleEntities.map((entity: any) => {
                            const actionsData = collection.getListActions(entity, componentPermission);
                            let isChecked = isAllChecked || checks.hasOwnProperty(entity[collection.keyPropName]) ? checks[entity[collection.keyPropName]] : false;
                            return (
                                <ListRow
                                    key={entity[collection.keyPropName]}
                                    actionsData={actionsData}
                                    isChecked={isChecked}
                                    entity={entity}
                                    collection={collection}
                                    check={check}
                                    checks={checks}
                                />
                            )
                        })
                    }
                    </tbody>
                </Table>
            }
        </Card>
    )
}

List.defaultProps = {
    isRefreshing: false,
}


export {
    List,
};

export default withTheme(List);