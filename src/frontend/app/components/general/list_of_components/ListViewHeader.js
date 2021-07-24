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
                    {header.map(item => item.value === 'id' ? null : <th key={item.value} style={item.width ? {width: item.width} : null} title={item.value}>{item.value}</th>)}
                    <th>Actions</th>
                </tr>
            </thead>
        );
    }
}

ListViewHeader.propTypes = {
    header: PropTypes.array.isRequired,
}

export default ListViewHeader;