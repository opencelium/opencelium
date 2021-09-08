import React from 'react';
import {connect} from 'react-redux';
import styles from "@themes/default/layout/header";
import {CSearch} from "@classes/components/general/CSearch";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {fetchDataForSearch} from "@actions/app";
import Select from "@basic_components/inputs/Select";
import {withRouter} from "react-router";

function mapStateToProps(state){
    const app = state.get('app');
    return{
        dataForSearch: app.get('dataForSearch'),
        fetchingDataForSearch: app.get('fetchingDataForSearch'),
    }
}

@connect(mapStateToProps, {fetchDataForSearch})
class Search extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            searchValue: '',
        }
    }

    componentDidMount() {
        this.props.fetchDataForSearch()
    }

    handleInputChange(searchValue){
        this.setState({
            searchValue,
        });
    }

    openComponent(value, e){
        const {router, dataForSearch} = this.props;
        this.setState({
            searchValue: '',
        });
        let categoryName = '';
        for(let param in dataForSearch){
            if(dataForSearch[param].findIndex(entry => entry.id === value.value && entry.title === value.label) !== -1){
                categoryName = param;
                break;
            }
        }
        router.push('/');
        setTimeout(() => router.push(`/${categoryName}/${value.value}/update`), 10);
    }

    getData(){
        const {searchValue} = this.state;
        const {dataForSearch} = this.props;
        let data = [];
        if(dataForSearch){
            const Search = new CSearch({searchValue, sources: dataForSearch});
            const searchResult = Search.getResults();
            for(let param in searchResult){
                let options = [];
                for(let i = 0; i < searchResult[param].length; i++){
                    options.push({label: searchResult[param][i].title, value: searchResult[param][i].id});
                }
                data.push({label: param, options});
            }
        }
        return data;
    }

    render(){
        const {searchValue} = this.state;
        const {fetchingDataForSearch} = this.props;
        return (
            <Select
                placeholder={'Search...'}
                className={styles.search_input}
                inputValue={searchValue}
                value={null}
                menuIsOpen={searchValue.length > 0}
                isLoading={fetchingDataForSearch === API_REQUEST_STATE.START}
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