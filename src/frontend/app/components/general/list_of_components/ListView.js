import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/general/list_of_components";
import ListViewItem from "@components/general/list_of_components/ListViewItem";
import ListViewHeader from "@components/general/list_of_components/ListViewHeader";
import Table from "@basic_components/table/Table";
import {withRouter} from "react-router";

class ListView extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {items, header, ...listViewItemProps} = this.props;
        return(
            <div className={styles.list_view}>
                <Table>
                    <ListViewHeader header={header}/>
                    <tbody>
                        {
                            items.map((item, index) => {
                                let key = item.find(element => element.name === 'id');
                                if(!key){
                                    key = item.find(element => element.name === 'name');
                                }
                                if(!key){
                                    key = item.find(element => element.name === 'label');
                                }
                                if(!key){
                                    key = item.find(element => element.name === 'title');
                                }
                                if(!key){
                                    key = index;
                                } else{
                                    key = key.value;
                                }
                                return(<ListViewItem key={key} item={item} {...listViewItemProps}/>);
                            })
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

export default withRouter(ListView);