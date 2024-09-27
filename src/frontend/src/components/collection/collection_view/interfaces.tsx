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

import {ITheme} from "@style/Theme";
import ListCollection from "@application/classes/ListCollection";
import { ComponentPermissionProps } from "@application/interfaces/IApplication";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";

interface InlineEditInputProps{
    theme?: ITheme,
    updateValue: (newValue: string) => void,
    initialValue: string,
    isInProcess?: boolean,
    maxLength?: number,
}

interface GridStyledProps{
    gridViewType?: number,
}

interface ThStyledProps{
    width?: string,
}

interface ViewProps{
    theme?: ITheme,
    componentPermission?: ComponentPermissionProps,
    collection: ListCollection<any>,
    searchValue?: string,
    currentPage?: number,
    gridViewType?: number,
    entitiesPerPage?: number,
    isRefreshing?: boolean,
    shouldBeUpdated?: boolean,
    hasPaginationProps: boolean,
    decreasePage: any,
}

interface ListViewProps extends ViewProps{
    checks: any[],
    setChecks: (checks: any[]) => void,
    filterData?: any,
    isCard?: boolean,
    onListRowClick?: (entity: any) => void,
    hasPaginationProps: boolean,
}

interface CollectionViewProps{
    theme?: ITheme,
    componentPermission?: ComponentPermissionProps,
    collection: ListCollection<any>,
    isLoading?: boolean,
    shouldBeUpdated?: boolean,
    hasTopBar?: boolean,
    hasTitle?: boolean,
    hasViewSection?: boolean,
    defaultViewType?: ViewType | '',
    hasError?: boolean,
    isListViewCard?: boolean,
    defaultFilterData?: any,
    loadingStyles?: any,
    onListRowClick?: (entity: any) => void,
    paginationProps?: {
        totalPages: number,
        setPage: (page: number) => void,
    } | undefined | null,
}

interface CheckProps{
    value: string,
    isChecked: boolean,
}

enum SortType{
    //ascending sort
    asc,

    //descending sort
    desc
};

export {
    InlineEditInputProps,
    GridStyledProps,
    ThStyledProps,
    ListViewProps,
    ViewProps,
    CheckProps,
    SortType,
    CollectionViewProps,
}
