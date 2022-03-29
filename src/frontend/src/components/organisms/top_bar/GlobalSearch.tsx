import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import { SearchProps } from './interfaces';
import {useAppDispatch} from "../../../hooks/redux";
import {getGlobalSearchData} from "@action/application/ApplicationCreators";
import {Application} from "@class/application/Application";
import {useNavigate} from "react-router";
import {ComponentRoutes, SingleSearchResult} from "@requestInterface/application/IApplication";
import ReactSelect from "@atom/input/select/ReactSelect";
import {setSearchValue as setGlobalSearchValue} from "@slice/application/ApplicationSlice";
import {API_REQUEST_STATE} from "@interface/application/IApplication";


const GlobalSearch: FC<SearchProps> =
    ({

     }) => {
        const {gettingGlobalSearchData, globalSearchData} = Application.getReduxState();
        const searchResult: SingleSearchResult[] = globalSearchData?.result || [];
        const dispatch = useAppDispatch();
        let navigate = useNavigate();
        const [searchValue, setSearchValue] = useState<string>('');
        const onChangeSearchValue = (newSearchValue: string) => {
            if(newSearchValue !== ''){
                dispatch(getGlobalSearchData(newSearchValue));
            }
            setSearchValue(newSearchValue);
        }
        const openComponent = (option: any) => {
            let route = '';
            let index = searchResult.findIndex((entry: SingleSearchResult) => `${entry.components}_${entry.id}` === option.id)
            if(index !== -1){
                route = ComponentRoutes[searchResult[index].components];
            }
            dispatch(setGlobalSearchValue(searchValue));
            setSearchValue('');
            navigate(route, { replace: false });
        }
        const getData = () => {
            let data = [];
            if(globalSearchData){
                for(let i = 0; i < searchResult.length; i++){
                    let option = {label: searchResult[i].title, value: searchResult[i].id, id: `${searchResult[i].components}_${searchResult[i].id}`};
                    let index = data.findIndex(elem => elem.label === searchResult[i].components);
                    if(index !== -1){
                        data[index].options.push(option);
                    } else{
                        data.push({label: searchResult[i].components, options: [option]});
                    }
                }
            }
            return data;
        }
        const isLoading = gettingGlobalSearchData === API_REQUEST_STATE.START;
        return (
            <ReactSelect
                placeholder={'Search...'}
                inputValue={searchValue}
                value={null}
                menuIsOpen={searchValue.length > 0 && !isLoading}
                isLoading={isLoading}
                onInputChange={onChangeSearchValue}
                onChange={openComponent}
                options={getData()}
                maxMenuHeight={200}
                minMenuHeight={50}
                styles={{
                    container: (provided: any, {isFocused, isDisabled}: {isFocused: boolean, isDisabled: boolean}) => ({
                        ...provided,
                        width: '200px',
                        border: 'none',
                        marginRight: '5px !important',
                    }),
                    control: (provided: any, {isFocused, isDisabled}: {isFocused: boolean, isDisabled: boolean}) => ({
                        ...provided,
                        width: '200px',
                        float: 'left',
                        border: 'none',
                    })
                }}
                selectMenuControlStyles={{
                    borderRadius: '2px',
                    top: '-2px',
                    left: '-6px'
                }}
                components={{DropdownIndicator: null}}
            />
        )
    }

GlobalSearch.defaultProps = {
}


export {
    GlobalSearch,
};

export default withTheme(GlobalSearch);