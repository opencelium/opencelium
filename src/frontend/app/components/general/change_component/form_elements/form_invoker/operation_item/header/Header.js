/*
 * Copyright (C) <2020>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Input from '@basic_components/inputs/Input';

import styles from '@themes/default/general/change_component.scss';
import FormSelect from "../../../FormSelect";
import {isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {HTTPRequestHeaders} from "@utils/constants/HTTPRequestHeaders";
import HeaderValue from "./HeaderValue";
import HeaderKey from "./HeaderKey";
import ToolboxThemeInput from "../../../../../../../hocs/ToolboxThemeInput";

const HEADER_LIMIT = 2;

/**
 * Component for Header in Invoker.RequestItem
 */
class Header extends Component{

    constructor(props){
        super(props);
        this.state = {
            header_prop: {value: 0, label: 'Choose Key ...', hint: 'Choose key to read a hint'},
            header_val: '',
            onDeleteButtonOver: false,
            hasDeleteButton: false,
            currentKey: -1,
            focused: false,
            iterator: 1,
        };

        this.commonSource = this.filterItems();
        //filter
    }

    filterItems(){
        const {entity} = this.props;
        let header = entity.header;
        return HTTPRequestHeaders.filter(h1 => header.findIndex(h2 => h2.name === h1.value) === -1);
    }

    componentDidUpdate(){
        this.commonSource = this.filterItems();
    }
    /**
     * to open next headers
     */
    increaseIterator(){
        this.setState({iterator: this.state.iterator + 1});
    }

    /**
     * to open previous headers
     */
    decreaseIterator(){
        this.setState({iterator: this.state.iterator - 1});
    }

    changeHeaderProp(value){
        this.setState({header_prop: value});
    }

    changeHeaderVal(value){
        this.setState({header_val: value});
    }

    /**
     * to show delete button
     */
    isOnDeleteButtonOver(){
        this.setState({onDeleteButtonOver: true});
    }

    /**
     * to hide delete button
     */
    isNotOnDeleteButtonOver(){
        this.setState({onDeleteButtonOver: false});
    }

    /**
     * to show delete button if has
     */
    showDeleteButton(e, key){
        const {readOnly} = this.props.data;
        if(!readOnly) {
            this.setState({
                hasDeleteButton: true,
                currentKey: key
            });
        }
    }

    /**
     * to hide delete button if has not
     */
    hideDeleteButton(){
        this.setState({
            hasDeleteButton: false,
            currentKey: -1,
        });
    }

    handleChange(value, key, type){
        const {entity, updateEntity} = this.props;
        let header = entity.header;
        let headerIndex = header.findIndex((h) => h.name === key);
        let newHeader = header[headerIndex];
        if(type === 'name') {
            if(newHeader.name === value.value){
                return;
            }
            this.commonSource = this.commonSource.filter(i => i.value !== value.value);
            this.commonSource.push(this.findValueInHeaderSource(header[headerIndex].name));
        }
        newHeader[type] = isString(value) ? value : value.value;
        entity.updateHeaderByName(newHeader);
        updateEntity();
        this.setState({
            header_prop: {value: 0, label: 'Choose Key ...', hint: 'Choose key to read a hint'},
            header_val: '',
        });
    }

    onFocusValue(e){
        this.setState({
            focused: true,
        });
    }

    onBlurValue(e){
        this.setState({
            focused: false,
        });
    }

    findValueInHeaderSource(value){
        let elem = HTTPRequestHeaders.find(h => h.value === value);
        if(elem) {
            return elem;
        }
        return null;
    }

    renderInputs(){
        const {onDeleteButtonOver, hasDeleteButton, currentKey} = this.state;
        const {entity, data, forConnection, hasHeightLimits} = this.props;
        const {readOnly} = data;
        let isReadonly = false;
        if(readOnly){
            isReadonly = true;
        }
        let items = hasHeightLimits ? this.getCurrentHeaders() : entity.header;
        return items.map((item, key) => {
            let itemValue = this.findValueInHeaderSource(item.name);
            if(itemValue) {
                let itemSource = [itemValue].concat(this.commonSource);
                return (
                    <div
                        style={{position: 'relative'}}
                        key={itemValue.value}
                        onMouseEnter={(e) => ::this.showDeleteButton(e, key)}
                        onMouseLeave={::this.hideDeleteButton}
                        className={hasHeightLimits ? styles.operation_item_header_appear : ''}>
                        <HeaderKey
                            forConnection={forConnection}
                            isReadonly={isReadonly}
                            itemSource={itemSource}
                            item={item}
                            itemValue={itemValue}
                            handleChange={::this.handleChange}
                            onFocusValue={::this.onFocusValue}
                            onBlurValue={::this.onBlurValue}
                        />
                        <HeaderValue
                            item={item}
                            readOnly={readOnly}
                            onFocus={::this.onFocusValue}
                            onBlur={::this.onBlurValue}
                            onChange={::this.handleChange}
                            forConnection={forConnection}
                        />
                        {
                            !isReadonly && hasDeleteButton && currentKey === key
                                ?
                                <div>
                                    <TooltipFontIcon
                                        className={styles.invoker_item_delete_button}
                                        value={onDeleteButtonOver ? 'delete_forever' : 'delete'}
                                        onMouseOver={::this.isOnDeleteButtonOver}
                                        onMouseLeave={::this.isNotOnDeleteButtonOver}
                                        onClick={(e) => ::this.deleteItem(e, itemValue)}
                                        tooltip={'Delete Header'}
                                    />
                                </div>
                                :
                                null
                        }
                    </div>
                );
            }
        });
    }

    addItem(){
        const {header_prop, header_val} = this.state;
        const {entity, updateEntity, index, headerType} = this.props;
        let header = entity.header;
        if(header_prop.value === 0){
            let elem = document.getElementById(`header_prop_${headerType}_${index}`);
            if(elem) {
                elem.click();
            }
            return;
        }
        if(header_val === ''){
            let elem = document.getElementById(`header_val_${headerType}_${index}`);
            if(elem) {
                elem.focus();
            }
            return;
        }
        let key = header_prop.value;
        entity.addHeader({name: key, value: header_val});
        this.commonSource = this.commonSource.filter(i => i.value !== key);
        updateEntity();
        this.setState({
            header_prop: {value: 0, label: 'Choose Key ...', hint: 'Choose key to read a hint'},
            header_val: '',
        });
    }

    deleteItem(e, item){
        const {entity, updateEntity} = this.props;
        entity.removeHeaderByName(item.value);
        this.commonSource.push(item);
        updateEntity();
        this.setState({
            header_prop: {value: 0, label: 'Choose Key ...', hint: 'Choose key to read a hint'},
            header_val: '',
        });
    }

    getCurrentHeaders(){
        const {iterator} = this.state;
        const {entity} = this.props;
        return entity.header.slice((iterator - 1) * HEADER_LIMIT, (iterator - 1) * HEADER_LIMIT + HEADER_LIMIT);
    }

    renderAddItem(){
        const {tourStep, index, headerType, forConnection} = this.props;
        if(this.commonSource.length === 0)
            return null;
        return (
            <div>
                <FormSelect
                    data={{
                        tourStepHint: tourStep ? tourStep : '',
                        icon: forConnection ? '' : 'label_outline',
                        selectClassName: `${styles.invoker_item_prop_add}`,
                        source: this.commonSource,
                        name: 'header_prop',
                        placeholder: 'Key',
                        label: 'Key',
                        required: false,
                        visible: true
                    }}
                    value={this.state.header_prop}
                    id={`header_prop_${headerType}_${index}`}
                    handleChange={::this.changeHeaderProp}
                    entity={{}}
                    hasHintTour={true}
                    onFocus={::this.onFocusValue}
                    onBlur={::this.onBlurValue}
                />
                <div className={styles.invoker_item_add_button}>
                    <TooltipFontIcon isButton={true} value={'add'} tooltip={'Add Header'} onClick={::this.addItem} iconStyles={{cursor: 'pointer'}}/>
                </div>
                <Input
                    onChange={::this.changeHeaderVal}
                    name={'header_val'}
                    id={`header_val_${headerType}_${index}`}
                    label={'Value'}
                    type={'text'}
                    maxLength={255}
                    value={this.state.header_val}
                    className={`${styles.invoker_item_val_add}`}
                    theme={{label: styles.form_input_label}}
                    onFocus={::this.onFocusValue}
                    onBlur={::this.onBlurValue}
                />
            </div>
        );
    }

    renderNavigation(){
        const {iterator} = this.state;
        const {hasHeightLimits, entity} = this.props;
        if(!hasHeightLimits || entity.header.length <= HEADER_LIMIT){
            return null;
        }
        const isPrevDisable = (iterator - 1) * HEADER_LIMIT <= 0;
        const isNextDisable = iterator * HEADER_LIMIT >= entity.header.length;
        return(
            <React.Fragment>
                <div className={styles.operation_item_header_arrow}>
                    <TooltipFontIcon tooltip={'Previous'} value={'keyboard_arrow_up'} onClick={isPrevDisable ? null : ::this.decreaseIterator}
                                     className={`${styles.operation_item_header_arrow_prev} ${isPrevDisable ? styles.operation_item_header_arrow_disable : ''}`}/>
                    <TooltipFontIcon tooltip={'Next'} value={'keyboard_arrow_down'} onClick={isNextDisable ? null : ::this.increaseIterator}
                                     className={`${styles.operation_item_header_arrow_next} ${isNextDisable ? styles.operation_item_header_arrow_disable : ''}`}/>
                </div>
            </React.Fragment>
        );
    }

    render(){
        const {focused} = this.state;
        const {entity, data, forConnection, mode, noIcon, hasHeightLimits} = this.props;
        const {readOnly} = data;
        let items = entity.header;
        if(items.length === 0 && mode !== 'add'){
            return null;
        }
        let inputsStyle = {display: 'grid'};
        if(hasHeightLimits){
            inputsStyle.maxHeight = '200px';
        }
        return(
            <ToolboxThemeInput
                label={'Header'}
                isFocused={focused}
                style={forConnection ? {paddingBottom: 0} : null}
                inputElementClassName={styles.multiselect_label}
                inputElementStyle={forConnection ? {padding: 0} : {}}
                icon={forConnection || noIcon ? '' : 'public'}
            >
                {this.renderNavigation()}
                <div style={inputsStyle}>
                    {this.renderInputs()}
                    {readOnly || forConnection ? null : this.renderAddItem()}
                </div>
            </ToolboxThemeInput>
        );
    }
}

Header.propTypes = {
    entity: PropTypes.object.isRequired,
    updateEntity: PropTypes.func,
    data: PropTypes.object.isRequired,
    mode: PropTypes.string,
};

Header.defaultProps = {
    forConnection: false,
    mode: 'existed',
    index: 0,
    noIcon: false,
    hasHeightLimits: false,
};


export default Header;