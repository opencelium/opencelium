/*
 *  Copyright (C) <2022>  <becon GmbH>
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

interface GridStyledProps{
    gridViewType?: number,
}

interface ThStyledProps{
    width?: string,
}

interface ViewProps{
    theme?: ITheme,
    componentPermission?: ComponentPermissionProps,
    collection: ListCollection,
    searchValue?: string,
    currentPage?: number,
    gridViewType?: number,
    entitiesPerPage?: number,
    isRefreshing?: boolean,
    shouldBeUpdated?: boolean,
}

interface ListViewProps extends ViewProps{
    checks: any[],
    setChecks: (checks: any[]) => void;
}

interface CollectionViewProps{
    theme?: ITheme,
    componentPermission?: ComponentPermissionProps,
    collection: ListCollection,
    isLoading?: boolean,
    shouldBeUpdated?: boolean,
    hasTopBar?: boolean,
    hasTitle?: boolean,
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
    GridStyledProps,
    ThStyledProps,
    ListViewProps,
    ViewProps,
    CheckProps,
    SortType,
    CollectionViewProps,
}