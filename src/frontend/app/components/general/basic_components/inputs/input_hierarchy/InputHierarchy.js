import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Input from "../Input";
import Hierarchy from "./Hierarchy";
import styles from '../../../../../themes/default/general/basic_components.scss';
import CConnectorItem from "../../../../../classes/components/content/connection/CConnectorItem";
import FontIcon from "../../FontIcon";
import {setFocusById} from "../../../../../utils/app";




class InputHierarchy extends Component{
    constructor(props) {
        super(props);

        this.state = {
            hierarchy: CConnectorItem.createConnectorItem(props.hierarchy),
            isVisibleHierarchy: false,
            searchValue: '',
            inputClassName: '',
            searchClassName: '',
            hierarchyStyle: {},
        };
    }

    componentDidUpdate(prevProps){
        if(prevProps.hierarchy.methods.length !== this.props.hierarchy.methods.length
        || prevProps.hierarchy.operators.length !== this.props.hierarchy.operators.length) {
            this.setState({hierarchy: CConnectorItem.createConnectorItem(this.props.hierarchy)});
        }
    }

    handleChange(searchValue){
        const {hierarchy} = this.state;
        hierarchy.filterByNameOrType(searchValue);
        this.setState({
            hierarchy,
            searchValue,
        });
    }

    showHierarchy(){
        const {onAppear} = this.props;
        if(typeof onAppear === 'function') {
            this.props.onAppear();
        }
        this.setState({isVisibleHierarchy: true});
    }

    hideHierarchy(){
        const {onDisappear} = this.props;
        const that = this;
        if(typeof onDisappear === 'function') {
            this.props.onDisappear();
        }
        this.setState({isVisibleHierarchy: false, inputClassName: styles.input_disappear, searchClassName: styles.search_icon_appear});
        setTimeout(() => {that.setState({hierarchyStyle: {zIndex: 0}});}, 700);
    }

    showSearch(){
        this.setState({inputClassName: styles.input_appear, searchClassName: styles.search_icon_disappear, hierarchyStyle: {zIndex: 100}});
        setTimeout(() => {::this.showHierarchy(); setFocusById('input_hierarchy');}, 700);
    }

    render(){
        const {hierarchy, inputClassName, searchClassName, hierarchyStyle, searchValue, isVisibleHierarchy} = this.state;
        let isNotEmpty = hierarchy.methods.length !== 0 || hierarchy.operators.length !== 0;
        return(
            <div className={styles.input_hierarchy} style={hierarchyStyle}>
                <Input
                    onFocus={isNotEmpty ? ::this.showHierarchy : null}
                    onChange={::this.handleChange}
                    name={'input_hierarchy'}
                    id={'input_hierarchy'}
                    label={''}
                    type={'text'}
                    value={searchValue}
                    theme={{input: `${styles.input} ${inputClassName}`, inputElement: styles.input_element}}
                />
                <FontIcon value={'search'} className={`${styles.search_icon} ${searchClassName}`} onClick={::this.showSearch}/>
                {
                    isVisibleHierarchy && isNotEmpty
                    ?
                        <Hierarchy hierarchy={hierarchy} searchValue={searchValue} close={::this.hideHierarchy} onItemClick={::this.props.onItemClick}/>
                    :
                        null
                }
            </div>
        );
    }
}

InputHierarchy.propTypes = {
    hierarchy: PropTypes.object.isRequired,
    onAppear: PropTypes.func,
    onDisappear: PropTypes.func,
};

InputHierarchy.defaultProps = {
    onAppear: null,
    onDisappear: null,
};

export default InputHierarchy;