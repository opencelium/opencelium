/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import InputSelect from "@app_component/base/input/select/InputSelect";
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import {connect} from "react-redux";
import {setConnectionData, setCurrentTechnicalItem} from "@root/redux_toolkit/slices/ConnectionSlice";
import {setModalConnectionData, setModalCurrentTechnicalItem} from "@root/redux_toolkit/slices/ModalConnectionSlice";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";


function mapStateToProps(state, props){
    const {activeCategory, gettingCategories} = state.categoryReducer;
    return {
        activeCategory,
        gettingCategories,
    }
}
/**
 * Component for Form Category Select
*/
@connect(mapStateToProps, {})
@FormElement()
class FormCategory extends Component{

    constructor(props){
        super(props);
        this.state = {
            focused: false,
        };
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.gettingCategories === API_REQUEST_STATE.START && this.props.gettingCategories === API_REQUEST_STATE.FINISH) {
            const {source, name} = this.props.data;
            const {entity, activeCategory} = this.props;
            if (!entity[name] && activeCategory) {
                this.handleChange(this.findObjectByValue(source, activeCategory.id));
            }
        }
    }

    componentDidMount() {
    }

    /**
     * to focus on select form
     */
    onFocus(e){
        if(this.props.onFocus){
            this.props.onFocus(e);
        }
        this.setState({focused: true});
    }

    /**
     * to blur from select form
     */
    onBlur(e){
        if(this.props.onBlur){
            this.props.onBlur(e);
        }
        this.setState({focused: false});
    }

    /**
     * to change select form
     */
    handleChange(value){
        const {name, callback} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = value.hasOwnProperty('value') ? value.value : value;
        updateEntity(entity, name);
        if(typeof callback === 'function'){
            callback(value);
        }
    }

    findObjectByValue(arr, value) {
        for (const obj of arr) {
            if (obj.value === value) {
                return obj;
            }
            if (obj.subCategories && obj.subCategories.length > 0) {
                const foundInChildren = this.findObjectByValue(obj.subCategories, value);
                if (foundInChildren) {
                    return foundInChildren;
                }
            }
        }

        return null;
    }

    getValue(){
        const {source, name} = this.props.data;
        const {entity, value, activeCategory} = this.props;
        if(value && value.hasOwnProperty('label') && value.hasOwnProperty('value')){
            return value;
        }
        const selectedCategory = entity[name] || null;

        return this.findObjectByValue(source, selectedCategory);
    }

    render(){
        const {focused} = this.state;
        const {icon, source, name, placeholder, selectClassName, tourStep, tourStepHint, label, required, error, readonly, categoryList} = this.props.data;
        const {handleChange, hasHintTour, isDisabled} = this.props;
        let value = this.getValue();
        return (
            <InputSelect
                id={'input_'+name}
                error={error}
                className={selectClassName ? selectClassName : ''}
                name={name}
                value={value}
                onChange={(a) => this.handleChange(a)}
                onFocus={(a) => this.onFocus(a)}
                onBlur={(a) => this.onBlur(a)}
                options={source}
                closeOnSelect={false}
                placeholder={placeholder}
                isDisabled={isDisabled || readonly}
                iconTooltip={value && value.hasOwnProperty('hint') ? value.hint : ''}
                icon={icon}
                isFocused={focused}
                label={label}
                required={required}
                tourStep={tourStep}
                tooltipTourStep={hasHintTour ? tourStepHint : ''}
                categoryList={categoryList}
            />
        );
    }
}

FormCategory.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
    value: PropTypes.object,
};

FormCategory.defaultProps = {
    value: null,
    onFocus: null,
    onBlur: null,
    hasHintTour: false,
    handleChange: null,
    id: 'input_'
};


export default FormCategory;
