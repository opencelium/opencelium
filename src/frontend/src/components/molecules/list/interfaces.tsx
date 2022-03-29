import {ITheme} from "../../general/Theme";
import {ViewType} from "@organism/collection_view/CollectionView";

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