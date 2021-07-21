import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/general/list_of_components";
import ListViewItem from "@components/general/list_of_components/ListViewItem";
import ListViewHeader from "@components/general/list_of_components/ListViewHeader";
import Table from "@basic_components/table/Table";

class ListView extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {items, header} = this.props;
        return(
            <div className={styles.list_view}>
                <Table>
                    <ListViewHeader header={header}/>
                    <tbody>
                        {
                            items.map((item) => <ListViewItem item={item}/>)
                        }
                    </tbody>
                </Table>
            </div>
        );
    }
}

ListView.propTypes = {
    items: PropTypes.array.isRequired,
    header: PropTypes.array.isRequired,
}

export default ListView;