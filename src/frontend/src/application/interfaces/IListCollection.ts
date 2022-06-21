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

import React, {ReactNode} from "react";
import {AppDispatch} from "../utils/store";
import {API_REQUEST_STATE, ComponentPermissionProps} from "../interfaces/IApplication";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {SortType} from "@app_component/collection/collection_view/interfaces";

type titleFunc = (data: any) => ReactNode;
export interface ListCollectionCardProps{
    title: string | titleFunc,
    subtitle?: string | titleFunc,
    image?: string | titleFunc,
}

export interface MultipleTitleProps{
    name: string,
    link?: string,
}

export interface ListProp{
    propertyKey: string,
    width?: string,
    getValue?: (entity: any) => any,
    replace?: boolean,
    style?: any;
}

export interface IListCollection{
    dispatch?: AppDispatch;
    deletingEntitiesState?: API_REQUEST_STATE;
    uploadingImage?: API_REQUEST_STATE;
    title?: string | React.ReactNode;
    keyPropName: string;

    //array of instance properties that should be displayed in the List
    //supported formats:
    // - <propertyName(string|number)> - just a name
    // - <propertyName(object).propertyName> - if property is an object than use dot to go deeper
    // - <propertyName(array of string|number)> - such array will be displayed as a concatenation of values separated with comma
    // - <propertyName(array of objects)[subPropertyName]> - such array will be mapped by subPropertyName
    listProps: ListProp[];
    listStyles?: any;
    gridProps: ListCollectionCardProps;
    sortingProps: string[];
    //translations for listProps
    translations: any;
    getTopActions?: (viewType?: ViewType, checkedIds?: number[] | string[]) => React.ReactNode;
    getGridActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode;
    getListActions?: (entity: any, componentPermission: ComponentPermissionProps) => React.ReactNode;
    entities: any[];
    filteredEntities?: any[];
    hasActions?: boolean;
    hasCheckboxes?: boolean;
    hasSearch?: boolean;
    hasCardLink?: boolean;
    isCardLinkExternal?: boolean;
    currentItem?: any;
    isCurrentItem?: (entity: any) => boolean;
    search(element: any, searchValue: string): boolean;
    sort(sortingProp: string, sortingType: SortType): void;
    asc(a: string | number, b: string | number): number;
    desc(a: string | number, b: string | number): number;
}