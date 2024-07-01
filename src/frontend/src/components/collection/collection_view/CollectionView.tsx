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
import {Application} from "@application/classes/Application";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {
    setViewType as setViewTypeGlobally,
    setGridViewType as setGridViewTypeGlobally,
    setSearchFields, setCurrentPages
} from "@application/redux_toolkit/slices/ApplicationSlice";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import ContentLoading from "@app_component/base/loading/ContentLoading";
import InputText from "@app_component/base/input/text/InputText";
import { TooltipButton } from '@app_component/base/tooltip_button/TooltipButton';
import Button from "@app_component/base/button/Button";
import Filter from "@app_component/collection/filter/Filter";
import {ColorTheme} from "@style/Theme";
import {Pagination} from "../Pagination";
import {GridViewMenu, GridViewType} from "../GridViewMenu";
import {List} from "./List";
import {CollectionViewProps} from "./interfaces";
import {ActionsStyled, CollectionViewStyled, TopSectionStyled, ViewSectionStyled} from "./styles";
import {Grid} from "./Grid";
import Title from "../collection_title/Title";
import {BadRequest} from "@app_component/default_pages/bad_request/BadRequest";
import {debounce} from "@application/utils/utils";
import CategoryTabs from '@entity/category/components/category_tabs/CategoryTabs';

const LIST_VIEW_ENTITIES_NUMBER = 10;

export enum ViewType{
    LIST= 'LIST',
    GRID= 'GRID',
}

const CollectionView: FC<CollectionViewProps> =
    ({
        collection,
        isLoading,
        componentPermission,
        shouldBeUpdated,
        hasTopBar,
        hasTitle,
        hasViewSection,
        defaultViewType,
        hasError,
        isListViewCard,
        defaultFilterData,
    }) => {
        const dispatch = useAppDispatch();
        const {searchFields, currentPages, viewType, gridViewType} = Application.getReduxState();
        const searchValuePropertyName = collection?.name || '';
        const [searchValue, setSearchValue] = useState<string>(searchValuePropertyName ? searchFields[searchValuePropertyName] || '' : '')
        const [isRefreshing, setIsRefreshing] = useState(false);
        const [isFilterVisible, toggleFilter] = useState<boolean>(false);
        const [filterData, setFilterData] = useState(defaultFilterData);
        const [checks, setChecks] = useState<any>({});
        const [entitiesPerPage, setEntitiesPerPage] = useState(LIST_VIEW_ENTITIES_NUMBER)
        const [currentPage, setCurrentPage] = useState(searchValuePropertyName ? currentPages[searchValuePropertyName] || 1 : 1);
        const [totalPages, setTotalPages] = useState(Math.ceil(collection.entities.length / entitiesPerPage))
        let applicationViewType = viewType;
        if(defaultViewType !== ''){
            applicationViewType = defaultViewType;
        }
        useEffect(() => {
            if(searchValuePropertyName){
                debounce(() => {dispatch(setSearchFields({[searchValuePropertyName]: searchValue}))})();
            }
        }, [searchValue])
        useEffect(() => {
            if(searchValuePropertyName){
                debounce(() => {dispatch(setCurrentPages({[searchValuePropertyName]: currentPage}))})();
            }
        }, [currentPage])
        useEffect(() => {
            let newEntitiesPerPage = LIST_VIEW_ENTITIES_NUMBER;
            if(applicationViewType === ViewType.GRID){
                switch(gridViewType){
                    case 2:
                        newEntitiesPerPage = 6;
                        break;
                    case 3:
                        newEntitiesPerPage = 9;
                        break;
                    case 4:
                        newEntitiesPerPage = 12;
                        break;
                    case 5:
                        newEntitiesPerPage = 15;
                        break;
                }
            }
            setEntitiesPerPage(newEntitiesPerPage);
            setTotalPages(Math.ceil(collection.filteredEntities.length / newEntitiesPerPage));
        }, [currentPage, searchValue, applicationViewType, gridViewType, collection.entities.length, shouldBeUpdated, filterData]);
        useEffect(() => {
            if(collection.deletingEntitiesState === API_REQUEST_STATE.FINISH){
                setChecks([]);
            }
        }, [collection.deletingEntitiesState]);
        const onChangeViewType = (newViewType: ViewType) => {
            setIsRefreshing(true);
            setTimeout(() => {
                dispatch(setViewTypeGlobally(newViewType));
                setIsRefreshing(false);
            }, 300);
        }
        const onChangeViewGridType = (newGridViewType: GridViewType) => {
            dispatch(setGridViewTypeGlobally(newGridViewType));
        }
        const setPage = (page: number) => {
            setIsRefreshing(true);
            setTimeout(() => {
                setCurrentPage(page);
                setIsRefreshing(false);
            }, 300);
        }
        const search = (searchValue: string) => {
            setCurrentPage(1);
            setSearchValue(searchValue);
        }
        let checkedIds: any[] = [];
        for(let id in checks){
            if(checks[id]){
                checkedIds.push(id);
            }
        }
        const hasSearch = collection.hasSearch && collection.entities.length > 0;
        if(hasError){
            return(
                <BadRequest/>
            )
        }
        if(isLoading){
            return(
                <ContentLoading/>
            )
        }
        return (
            <ErrorBoundary>
                <CollectionViewStyled>
                    {hasTitle && <Title title={collection.title}/>}
                    {hasTopBar && <TopSectionStyled hasViewSection={hasViewSection}>
                        <ActionsStyled>
                            {collection.getTopActions(applicationViewType, checkedIds)}
                            {collection.hasFilter &&
                                <Button key={'filter_button'} icon={'filter_list'} label={'Filter'} handleClick={() => toggleFilter(!isFilterVisible)}/>
                            }
                        </ActionsStyled>
                        {hasSearch &&
                            <InputText marginLeft={'0'} autoFocus inputHeight={'35px'} value={searchValue} onChange={(e) => search(e.target.value)} minHeight={'1'} width={'200px'} placeholder={'Search field'}/>
                        }
                        {
                            collection.AfterSearchComponents
                        }
                        {hasViewSection &&
                            <ViewSectionStyled>
                                <TooltipButton target={'view_list'} tooltip={'List'} position={'top'} icon={'view_list'}
                                               size={24} hasBackground={false} color={ColorTheme.Turquoise}
                                               handleClick={() => onChangeViewType(ViewType.LIST)}/>
                                <GridViewMenu setGridViewType={onChangeViewGridType} viewType={applicationViewType}
                                              setViewType={onChangeViewType} setIsRefreshing={setIsRefreshing}/>
                            </ViewSectionStyled>
                        }
                    </TopSectionStyled>}
                    {isFilterVisible &&
                        <Filter>
                            {collection.getFilterComponents(filterData, (data: any) => setFilterData({...data}))}
                        </Filter>
                    }
                    {collection.name === "schedules" && <CategoryTabs readOnly/>}
                    {collection.name === "connections" && <CategoryTabs/>}
                    <div style={{marginTop: hasTopBar ? '0' : '20px'}}>
                        {applicationViewType === ViewType.LIST &&
                            <List
                                isCard={isListViewCard}
                                collection={collection}
                                searchValue={searchValue}
                                currentPage={currentPage}
                                entitiesPerPage={entitiesPerPage}
                                componentPermission={componentPermission}
                                checks={checks}
                                setChecks={setChecks}
                                isRefreshing={isRefreshing}
                                shouldBeUpdated={shouldBeUpdated}
                                filterData={filterData}
                            />}
                        {applicationViewType === ViewType.GRID &&
                            <Grid
                                collection={collection}
                                searchValue={searchValue}
                                currentPage={currentPage}
                                gridViewType={gridViewType}
                                entitiesPerPage={entitiesPerPage}
                                componentPermission={componentPermission}
                                isRefreshing={isRefreshing}
                                shouldBeUpdated={shouldBeUpdated}
                            />
                        }
                    </div>
                    <Pagination currentPage={currentPage} total={totalPages} setCurrentPage={setPage}/>
                </CollectionViewStyled>
            </ErrorBoundary>
        )
    }

CollectionView.defaultProps = {
    shouldBeUpdated: false,
    hasTopBar: true,
    hasTitle: true,
    hasViewSection: true,
    defaultViewType: '',
    hasError: false,
    isListViewCard: true,
    defaultFilterData: null,
    loadingStyles: {},
}


export {
    CollectionView,
};

export default withTheme(CollectionView);
