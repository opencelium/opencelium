/*
 * Copyright (C) <2022>  <becon GmbH>
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

import {FormElement} from "@entity/connection/components/decorators/FormElement";
import BrowseButton from "@entity/connection/components/components/general/basic_components/buttons/BrowseButton";


/**
 * Component for Form Input File
 */
@FormElement()
class FormIcon extends Component{

    constructor(props){
        super(props);

        this.state = {
            browseTitle: '',
        };
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
        const {data} = this.props;
        const {icon, label, name} = data;
        let {tourStep, browseTitle} = data;
        if(this.state.browseTitle !== ''){
            browseTitle = this.state.browseTitle;
        }
        return (
            <BrowseButton
                label={label}
                icon={icon}
                tourStep={tourStep}
                name={name}
                browseTitle={browseTitle}
                browseProps={{
                    icon: "file_upload",
                    label: "Upload",
                    onChange: (a) => this.handleChange(a),
                    accept: "image/x-png,image/jpeg",
                }}
            />
        );
    }
}

FormIcon.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default FormIcon;