import React from 'react';
import {connect} from 'react-redux';
import styles from "@themes/default/layout/header";
import {CSearch} from "@classes/components/general/CSearch";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {fetchDataForSearch, setSearchValue} from "@actions/app";
import Select from "@basic_components/inputs/Select";
import {withRouter} from "react-router";
import {navigateTo} from "@utils/app";

function mapStateToProps(state){
    const app = state.get('app');
    return{
        dataForSearch: app.get('dataForSearch'),
        fetchingDataForSearch: app.get('fetchingDataForSearch'),
    }
}

@connect(mapStateToProps, {fetchDataForSearch, setSearchValue})
class Search extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            searchValue: '',
        }
    }

    handleInputChange(searchValue){
        this.props.fetchDataForSearch(searchValue)
        this.setState({
            searchValue,
        });
    }

    openComponent(value, e){
        const {router, dataForSearch, setSearchValue} = this.props;
        this.setState({
            searchValue: '',
        });
        let categoryName = '';
        for(let param in dataForSearch){
            if(dataForSearch[param].findIndex(entry => `${param}_${entry.id}` === value.id) !== -1){
                categoryName = param;
                break;
            }
        }
        setSearchValue(value.label);
        navigateTo(categoryName);
    }

    getData(){
        const {dataForSearch} = this.props;
        let data = [];
        if(dataForSearch){
            for(let param in dataForSearch){
                let options = [];
                for(let i = 0; i < dataForSearch[param].length; i++){
                    options.push({label: dataForSearch[param][i].title, value: dataForSearch[param][i].id, id: `${param}_${dataForSearch[param][i].id}`});
                }
                data.push({label: param, options});
            }
        }
        return data;
    }

    render(){
        const {searchValue} = this.state;
        const {fetchingDataForSearch} = this.props;
        let isLoading = fetchingDataForSearch === API_REQUEST_STATE.START;
        return (
            <Select
                placeholder={'Search...'}
                className={styles.search_input}
                inputValue={searchValue}
                value={null}
                menuIsOpen={searchValue.length > 0 && !isLoading}
                isLoading={isLoading}
                onInputChange={::this.handleInputChange}
                onChange={::this.openComponent}
                options={::this.getData()}
                maxMenuHeight={200}
                minMenuHeight={50}
                styles={{
                    container: (provided, {isFocused, isDisabled}) => ({
                        ...provided,
                        width: '200px',
                    })
                }}
                components={{DropdownIndicator: null}}
            />
        );
    }
}

export default withRouter(Search);