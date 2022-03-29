import React, {ReactNode} from "react";
import {SortType} from "@organism/collection_view/interfaces";
import {ComponentPermissionProps} from "@constants/permissions";
import {ViewType} from "@organism/collection_view/CollectionView";
import {AppDispatch} from "@store/store";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

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
    gridProps: ListCollectionCardProps;
    sortingProps: string[];
    //translations for listProps
    translations: any;
    getTopActions?: (viewType?: ViewType, checkedIds?: number[]) => React.ReactNode;
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