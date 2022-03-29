import {ITheme} from "../../general/Theme";
import ListCollection from "../../../classes/application/ListCollection";
import {ComponentPermissionProps} from "@constants/permissions";

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
    asc,
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