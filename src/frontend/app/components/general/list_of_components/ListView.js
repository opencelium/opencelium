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
        const {items, header, allChecked, checkAllEntities, checkOneEntity, checks, deleteCheck, sortType, toggleSortType, renderItemActions, readOnly, actionsShouldBeMinimized, ...listViewItemProps} = this.props;
        let listViewStyles = {overflow: 'hidden'};
        if(actionsShouldBeMinimized){
            listViewStyles.overflow = 'visible';
        }
        return(
            <div className={styles.list_view} style={listViewStyles}>
                <Table>
                    <ListViewHeader readOnly={readOnly} header={header} allChecked={allChecked} onCheckAll={checkAllEntities} setChecks={::this.setChecks} sortType={sortType} toggleSortType={toggleSortType}/>
                    <tbody>
                        {
                            items.map((item, index) => {
                                let key = item.find(element => element.name === 'id');
                                if(!key){
                                    key = index;
                                } else{
                                    key = key.value;
                                }
                                return(<ListViewItem key={key} index={key} readOnly={readOnly} actionsShouldBeMinimized={actionsShouldBeMinimized} renderAdditionalActions={renderItemActions} item={item} checks={checks} checkOneEntity={checkOneEntity} deleteCheck={deleteCheck} {...listViewItemProps} setChecks={::this.setChecks}/>);
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
    renderItemAction: PropTypes.func,
    readOnly: PropTypes.bool,
    actionsShouldBeMinimized: PropTypes.bool,
}

ListView.defaultProps = {
    readOnly: false,
    deletingEntity: null,
    actionsShouldBeMinimized: false,
}

export default withRouter(ListView);