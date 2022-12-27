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

import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import {useNavigate} from "react-router";
import {useAppDispatch} from "@application/utils/store";
import {getGlobalSearchData} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {Application} from "@application/classes/Application";
import {ComponentRoutes, SingleSearchResult} from "@application/requests/interfaces/IApplication";
import {setSearchFields as setGlobalSearchValue} from "@application/redux_toolkit/slices/ApplicationSlice";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import ReactSelect from "@app_component/base/input/select/ReactSelect";
import { SearchProps } from './interfaces';


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
            let searchValuePropertyName = route;
            if(searchValuePropertyName){
                dispatch(setGlobalSearchValue({[searchValuePropertyName]: option.label}));
                setSearchValue('');
                navigate(route, { replace: false });
            }
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