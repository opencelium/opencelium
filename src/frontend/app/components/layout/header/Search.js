import React from 'react';
import styles from "@themes/default/layout/header";
import Select from "@basic_components/inputs/Select";

class Search extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            searchValue: null,
        }
    }

    setSearchValue(searchValue){

    }

    render(){
        return(
            <div>
                <Select
                    className={styles.search_input}
                    value={searchValue}
                />
            </div>
        );
    }
}

export default Search;