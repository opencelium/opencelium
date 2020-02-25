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
import Input from '../../../../basic_components/inputs/Input';

import theme from "react-toolbox/lib/input/theme.css";
import styles from '../../../../../../themes/default/general/change_component.scss';
import FormSelect from "../../FormSelect";
import {isString} from "../../../../../../utils/app";
import TooltipFontIcon from "../../../../basic_components/tooltips/TooltipFontIcon";
import FontIcon from "../../../../basic_components/FontIcon";
import {HTTPRequestHeaders} from "../../../../../../utils/constants/HTTPRequestHeaders";
import HeaderValue from "./HeaderValue";


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
        const {entity, data} = this.props;
        const {readOnly, required} = data;
        let propertyLabel = 'Key';
        let valueLabel = 'Value';
        let isReadonly = false;
        if(readOnly){
            isReadonly = true;
        }
        let items = entity.header;
        return items.map((item, key) => {
            let itemValue = this.findValueInHeaderSource(item.name);
            if(itemValue) {
                let itemSource = [itemValue].concat(this.commonSource);
                return (
                    <div
                        style={{position: 'relative'}}
                        key={key}
                        onMouseEnter={(e) => ::this.showDeleteButton(e, key)}
                        onMouseLeave={::this.hideDeleteButton}>
                        <FormSelect
                            data={{
                                icon: 'bookmark',
                                selectClassName: styles.invoker_item_prop,
                                source: itemSource,
                                name: `select_header_${item.name}`,
                                placeholder: propertyLabel,
                                label: propertyLabel,
                                visible: true
                            }}
                            value={itemValue}
                            handleChange={(e) => ::this.handleChange(e, item.name, 'name')}
                            entity={{}}
                            onFocus={::this.onFocusValue}
                            onBlur={::this.onBlurValue}
                            isDisabled={isReadonly}
                        />

                        <HeaderValue
                            item={item}
                            readOnly={readOnly}
                            onFocus={::this.onFocusValue}
                            onBlur={::this.onBlurValue}
                            onChange={::this.handleChange}
                        />{/*
                        <Input
                            onChange={(e) => ::this.handleChange(e, item.name, 'value')}
                            name={`input_header_${item.name}`}
                            label={valueLabel}
                            type={'text'}
                            maxLength={255}
                            value={item.value}
                            readOnly={isReadonly}
                            className={styles.invoker_item_val}
                            theme={{label: styles.form_input_label}}
                            onFocus={::this.onFocusValue}
                            onBlur={::this.onBlurValue}
                        />*/}
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

    renderAddItem(){
        const {tourStep, index, headerType} = this.props;
        if(this.commonSource.length === 0)
            return null;
        return (
            <div>
                <FormSelect
                    data={{tourStepHint: tourStep ? tourStep : '', icon: 'label_outline', selectClassName: `${styles.invoker_item_prop_add}`, source: this.commonSource, name: 'header_prop', placeholder: 'Key', label: 'Key', required: false, visible: true}}
                    value={this.state.header_prop}
                    id={`header_prop_${headerType}_${index}`}
                    handleChange={::this.changeHeaderProp}
                    entity={{}}
                    hasHintTour={true}
                    onFocus={::this.onFocusValue}
                    onBlur={::this.onBlurValue}
                />
                <div className={styles.invoker_item_add_button}>
                    <TooltipFontIcon value={'add'} tooltip={'Add Header'} onClick={::this.addItem} style={{cursor: 'pointer'}}/>
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

    renderLabel(){
        let label = 'Header';
        let labelStyle = theme.label;
        if(this.state.focused){
            labelStyle += ' ' + styles.multiselect_focused;
        }
        return <label className={labelStyle}>{label}</label>;
    }

    render(){
        const {readOnly} = this.props.data;
        return(
            <div className={`${theme.withIcon} ${theme.input}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <div style={{display: 'grid'}}>
                    {this.renderInputs()}
                    {readOnly ? null : this.renderAddItem()}
                </div>
                <FontIcon value={'public'} className={theme.icon}/>
                <span className={theme.bar}/>
                {this.renderLabel()}
            </div>
        );
    }
}

Header.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default Header;