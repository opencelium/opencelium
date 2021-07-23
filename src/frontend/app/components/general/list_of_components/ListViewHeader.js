import React from 'react';
import styles from "@themes/default/general/list_of_components";
import PropTypes from "prop-types";

class ListViewHeader extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {header} = this.props;
        return(
            <thead>
                <tr>
                    {header.map(item => <th style={item.width ? {width: item.width} : null}>{item.value}</th>)}
                    <th style={{width: '20%'}}>Actions</th>
                </tr>
            </thead>
        );
    }
}

ListViewHeader.propTypes = {
    header: PropTypes.array.isRequired,
}

export default ListViewHeader;