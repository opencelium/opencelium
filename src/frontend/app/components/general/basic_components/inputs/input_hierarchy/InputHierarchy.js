import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Input from "../Input";
import Hierarchy from "./Hierarchy";
import styles from '../../../../../themes/default/general/basic_components.scss';
import CConnectorItem from "../../../../../classes/components/content/connection/CConnectorItem";
import {setFocusById} from "../../../../../utils/app";
import TooltipFontIcon from "../../tooltips/TooltipFontIcon";




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
            searchLabel: '',
            selectedItemKey: 0,
            selectedItem: null,
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

    onKeyDown(e) {
        switch (e.keyCode) {
            case 13:
                e.preventDefault();
                this.onItemClick();
                break;
            case 27:
                e.preventDefault();
                this.hideHierarchy();
                break;
            case 38:
                e.preventDefault();
                this.selectPrevItem();
                break;
            case 40:
                e.preventDefault();
                this.selectNextItem();
                break;
        }
    }

    onItemClick(){
        const {selectedItem} = this.state;
        const {onItemClick} = this.props;
        if(selectedItem) {
            onItemClick(null, selectedItem);
            this.hideHierarchy();
        }
    }

    selectPrevItem(){
        const {selectedItemKey} = this.state;
        this.setState({selectedItemKey: selectedItemKey - 1});
    }

    selectNextItem(){
        const {selectedItemKey} = this.state;
        this.setState({selectedItemKey: selectedItemKey + 1});
    }

    setKey(key){
        this.setState({selectedItemKey: key});
    }

    setItem(item){
        this.setState({selectedItem: item});
    }

    showHierarchy(){
        const {onAppear} = this.props;
        if(typeof onAppear === 'function') {
            this.props.onAppear();
        }
        this.setState({isVisibleHierarchy: true, searchLabel: 'Type method name or operator type'});
    }

    hideHierarchy(){
        const {onDisappear} = this.props;
        const that = this;
        if(typeof onDisappear === 'function') {
            this.props.onDisappear();
        }
        this.setState({isVisibleHierarchy: false, inputClassName: styles.input_disappear, searchClassName: styles.search_icon_appear, searchLabel: ''});
        setTimeout(() => {that.setState({hierarchyStyle: {zIndex: 0}});}, 700);
    }

    showSearch(){
        this.setState({inputClassName: styles.input_appear, searchClassName: styles.search_icon_disappear, hierarchyStyle: {zIndex: 100}});
        setTimeout(() => {::this.showHierarchy(); setFocusById('input_hierarchy');}, 700);
    }

    render(){
        const {hierarchy, inputClassName, searchClassName, hierarchyStyle, searchValue, isVisibleHierarchy, searchLabel, selectedItem, selectedItemKey} = this.state;
        const {currentItem} = this.props;
        let isNotEmpty = hierarchy.methods.length !== 0 || hierarchy.operators.length !== 0;
        const searchDisable = hierarchy.operators.length === 0 && hierarchy.methods.length === 0;
        return(
            <div className={styles.input_hierarchy} style={hierarchyStyle}>
                <Input
                    onFocus={isNotEmpty ? ::this.showHierarchy : null}
                    onChange={::this.handleChange}
                    onKeyDown={::this.onKeyDown}
                    name={'input_hierarchy'}
                    id={'input_hierarchy'}
                    label={searchLabel}
                    type={'text'}
                    value={searchValue}
                    theme={{input: `${styles.input} ${inputClassName}`, inputElement: styles.input_element}}
                />
                <TooltipFontIcon tooltip={'Search'} value={'search'} className={`${styles.search_icon} ${searchClassName} ${searchDisable ? styles.search_icon_disabled : ''}`} onClick={searchDisable ? null : ::this.showSearch}/>
                {
                    isVisibleHierarchy && isNotEmpty
                    ?
                        <Hierarchy
                            hierarchy={hierarchy}
                            selectedItem={selectedItem}
                            selectedItemKey={selectedItemKey}
                            searchValue={searchValue}
                            close={::this.hideHierarchy}
                            onItemClick={::this.props.onItemClick}
                            currentItem={currentItem}
                            setItem={::this.setItem}
                            setKey={::this.setKey}
                        />
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