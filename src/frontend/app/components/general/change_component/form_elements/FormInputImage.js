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

import {FormElement} from "@decorators/FormElement";
import BrowseButton from "@basic_components/buttons/BrowseButton";
import Checkbox from "@basic_components/inputs/Checkbox";
import styles from "@themes/default/general/change_component.scss";


/**
 * Component for Form Input File
 */
@FormElement()
class FormInputImage extends Component{

    constructor(props){
        super(props);

        this.state = {
            browseTitle: '',
            checkboxLabel: '',
            hasImage: true,
        };
    }

    onChangeCheckbox(e){
        let {checkboxLabel} = this.state;
        const {entity, updateEntity} = this.props;
        let hasImage = e.target.checked;
        if(!hasImage) {
            checkboxLabel = 'Set Image';
            entity.shouldDeleteImage = true;
        } else{
            checkboxLabel = '';
            entity.shouldDeleteImage = false;
        }
        this.setState({hasImage, checkboxLabel}, updateEntity(entity));
    }

    handleChange(e){
        const {name} = this.props.data;
        const {entity, updateEntity} = this.props;
        const f = e.target.files[0];
        if(f) {
            entity[name] = f;
            this.setState({browseTitle: f.name}, updateEntity(entity));
        } else{
            this.setState({browseTitle: ''});
        }
    };

    render(){
        const {hasImage, checkboxLabel} = this.state;
        const {entity, data} = this.props;
        const {icon, label, name} = data;
        let {tourStep, browseTitle} = data;
        if(this.state.browseTitle !== ''){
            browseTitle = this.state.browseTitle;
        } else{
            if(entity[name] && entity[name].hasOwnProperty('name')) {
                browseTitle = entity[name].name;
            }
        }
        return (
            <div className={styles.form_input_image}>
                <Checkbox
                    className={styles.form_input_image_checkbox}
                    labelClassName={styles.form_input_image_label}
                    label={checkboxLabel}
                    checked={hasImage}
                    onChange={::this.onChangeCheckbox}
                    inputPosition={'left'}
                />
                <BrowseButton
                    themeStyle={{paddingLeft: '20px'}}
                    label={label}
                    icon={icon}
                    tourStep={tourStep}
                    name={name}
                    browseTitle={browseTitle}
                    hideInput={!hasImage}
                    browseProps={{
                        icon: "file_upload",
                        label: "Upload",
                        onChange: ::this.handleChange,
                        accept: "image/x-png,image/jpeg",
                        name: label,
                    }}
                />
            </div>
        );
    }
}

FormInputImage.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormInputImage;