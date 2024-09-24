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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {capitalize} from "@application/utils/utils";
import {ListProp} from "@application/interfaces/IListCollection";
import {Table} from "@app_component/base/table/Table";
import Card from "@app_component/base/card/Card";
import {Text} from "@app_component/base/text/Text";
import { TooltipButton } from '@app_component/base/tooltip_button/TooltipButton';
import {ColorTheme} from "@style/Theme";
import {CheckProps, ListViewProps, SortType} from './interfaces';
import {EmptyList} from "../EmptyList";
import {ThStyled} from "./styles";
import {ListRow} from "../ListRow";


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
        filterData,
        isCard,
        onListRowClick,
        hasPaginationProps,
    }) => {
    const [sortTypes, setSortTypes] = useState<any>({});
    const [visibleEntities, setVisibleEntities] = useState([]);
    const [isAllChecked, setAllChecked] = useState(false);
    useEffect(() => {
        let newSortTypes: any = {};
        setVisibleEntities(collection.getEntitiesByPage(searchValue, 1, entitiesPerPage, filterData));
        for(let i = 0; i < collection.sortingProps.length; i++){
            newSortTypes[collection.sortingProps[i]] = SortType.asc;
        }
        setSortTypes(newSortTypes)
    }, []);
    useEffect(() => {
        if (!hasPaginationProps) {
            let newVisibleEntities = collection.getEntitiesByPage(searchValue, currentPage, entitiesPerPage, filterData);
            setVisibleEntities(newVisibleEntities);
            defineIsAllChecked(checks, newVisibleEntities);
        }
    }, [currentPage, searchValue, sortTypes, entitiesPerPage, collection.entities.length, shouldBeUpdated, filterData]);
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
    const CardComponent = isCard ? Card : React.Fragment;
    const cardProps = isCard ? {padding: '10px', margin: '0 0 20px 0', isRefreshing, overflow: 'auto', style: collection.listStyles} : {};
    return (
        <CardComponent {...cardProps}>
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
                            collection.listProps.map((listProp: ListProp<any>) => {
                                let propertyKey = listProp.propertyKey;
                                let columnWidth = listProp.width || 'auto';
                                const columnStyle = listProp.style || {};
                                if (propertyKey !== '') {
                                    let translationProp = propertyKey;
                                    let splitColumnName = propertyKey.split('.');
                                    if (splitColumnName.length > 1) {
                                        translationProp = splitColumnName.map((name: string, key: number) => key !== 0 ? capitalize(name) : name).join('');
                                    }
                                    let hasSortIcon = collection.sortingProps.findIndex((prop: string) => prop === propertyKey) !== -1;
                                    let sortIcon = hasSortIcon ? sortTypes[propertyKey] === SortType.asc ? 'keyboard_arrow_up' : 'keyboard_arrow_down' : '';
                                    return (
                                        <ThStyled key={propertyKey} width={columnWidth}>
                                            <div style={{display: 'flex', justifyContent: 'center', ...columnStyle}}>
                                                {collection.translations[translationProp] && <span style={{marginLeft: hasSortIcon ? '24px' : 0}}><Text value={collection.translations[translationProp]}/></span>}
                                                {hasSortIcon &&
                                                    <TooltipButton target={'sort_button'} tooltip={sortTypes[propertyKey] === SortType.asc ? 'Asc' : 'Desc'} position={'top'} hasBackground={false} color={ColorTheme.Blue}
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
                                    onListRowClick={onListRowClick}
                                />
                            )
                        })
                    }
                    </tbody>
                </Table>
            }
        </CardComponent>
    )
}

List.defaultProps = {
    isRefreshing: false,
    filterData: null,
    isCard: true,
}


export {
    List,
};

export default withTheme(List);
