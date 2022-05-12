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

import {ITheme} from "@style/Theme";
import {ViewType} from "./collection_view/CollectionView";

interface PaginationProps{
    currentPage: number,
    total: number,
    setCurrentPage: (newPage: number) => void,
}

interface GridViewMenuProps{
    theme?: ITheme,
    viewType: ViewType,
    setGridViewType: (number: number) => void,
    setViewType: (viewType: ViewType) => void,
    setIsRefreshing: (isRefreshing: boolean) => void,
}

interface TypesProps{
    number: number,
    setType: (number: number) => void,
}

interface ListRowProps{
    theme?: ITheme,
    actionsData: any,
    isChecked: boolean,
    entity: any,
    collection: any,
    check: any,
    checks: any[],
}

export {
    PaginationProps,
    GridViewMenuProps,
    TypesProps,
    ListRowProps,
}