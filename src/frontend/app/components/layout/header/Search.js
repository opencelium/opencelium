import React from 'react';
import {connect} from 'react-redux';
import Select from 'react-select';
import styles from "@themes/default/layout/header";
import {CSearch} from "@classes/components/general/CSearch";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {fetchDataForSearch} from "@actions/app";

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
    };

    getData(){
        const {searchValue} = this.state;
        const {dataForSearch} = this.props;
        let data = [];
        if(dataForSearch){
            const Search = new CSearch({searchValue, sources: dataForSearch});
            const searchResult = Search.getResults();
            for(let param in searchResult){
                data.push({label: param, options: searchResult[param]});
            }
        }
        return data;
    }

    render(){
        const {fetchingDataForSearch} = this.props;
        return (
            <Select
                isLoading={fetchingDataForSearch === API_REQUEST_STATE.START}
                onInputChange={::this.handleInputChange}
                options={::this.getData()}
            />
        );
    }
}

export default Search;