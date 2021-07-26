import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/general/list_of_components";
import ListViewItem from "@components/general/list_of_components/ListViewItem";
import ListViewHeader from "@components/general/list_of_components/ListViewHeader";
import Table from "@basic_components/table/Table";
import {withRouter} from "react-router";
import {ComponentHasCheckboxes} from "@decorators/ComponentHasCheckboxes";


@ComponentHasCheckboxes()
class ListView extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.checks && prevProps.checks.length !== this.props.checks.length){
            this.props.setChecks(this.props.checks);
        }
    }

    setChecks(){
        this.props.setChecks(this.props.checks);
    }

    render(){
        const {items, header, allChecked, checkAllEntities, checkOneEntity, checks, deleteCheck, sortType, toggleSortType, ...listViewItemProps} = this.props;
        return(
            <div className={styles.list_view}>
                <Table>
                    <ListViewHeader header={header} allChecked={allChecked} onCheckAll={checkAllEntities} setChecks={::this.setChecks} sortType={sortType} toggleSortType={toggleSortType}/>
                    <tbody>
                        {
                            items.map((item, index) => {
                                let key = item.find(element => element.name === 'id');
                                if(!key){
                                    key = index;
                                } else{
                                    key = key.value;
                                }
                                return(<ListViewItem key={key} index={key} item={item} checks={checks} checkOneEntity={checkOneEntity} deleteCheck={deleteCheck} {...listViewItemProps} setChecks={::this.setChecks}/>);
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
    entityIdName: PropTypes.string.isRequired,
}

export default withRouter(ListView);