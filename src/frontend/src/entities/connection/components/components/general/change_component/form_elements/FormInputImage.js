/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import {FormElement} from "@entity/connection/components/decorators/FormElement";
import BrowseButton from "@entity/connection/components/components/general/basic_components/buttons/BrowseButton";
import Checkbox from "@entity/connection/components/components/general/basic_components/inputs/Checkbox";
import styles from "@entity/connection/components/themes/default/general/change_component.scss";
import ReactCrop from "@entity/connection/components/components/general/app/ReactCrop";
import Dialog from "@entity/connection/components/components/general/basic_components/Dialog";


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
            src: null,
            croppedImage: null,
        };
    }

    setCroppedImage(croppedImage){
        const {name} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = croppedImage;
        this.setState({croppedImage}, updateEntity(entity));
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
        const f = e.target.files[0];
        if(f) {
            const reader = new FileReader();
            reader.addEventListener('load', () =>
                this.setState({ src: reader.result })
            );
            reader.readAsDataURL(f);
            this.setState({
                browseTitle: f.name,
            })
        } else{
            this.setState({browseTitle: ''});
        }
    };

    render(){
        const {hasImage, checkboxLabel, src} = this.state;
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
                    onChange={(a) => this.onChangeCheckbox(a)}
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
                        onChange: (a) => this.handleChange(a),
                        accept: "image/x-png,image/jpeg",
                        name: label,
                    }}
                />
                <ReactCrop src={src} setCroppedImage={(a) => this.setCroppedImage(a)} className={styles.image_crop}/>
            </div>
        );
    }
}

FormInputImage.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormInputImage;