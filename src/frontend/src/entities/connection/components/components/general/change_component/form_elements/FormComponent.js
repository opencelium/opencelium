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
import {FormElement} from "@entity/connection/components/decorators/FormElement";
import Input from "@app_component/base/input/Input";
import {ComponentStyled} from './styles';
import {withTheme} from "styled-components";

/**
 * Form Component
 */
@FormElement()
class FormComponent extends Component{
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.entity !== this.props.entity ||
            nextProps.data !== this.props.data ||
            nextProps.updateEntity !== this.props.updateEntity ||
            nextProps.theme !== this.props.theme
        );
    }

    render(){
        const {name, label, icon} = this.props.data;
        const {entity, updateEntity} = this.props;
        let {Component, componentProps} = this.props.data;

        if(!componentProps){
            componentProps = {};
        }

        if(!icon){
            return (
                <Component
                    entity={entity}
                    updateEntity={updateEntity}
                    {...componentProps}
                />
            );
        }

        return (
            <Input label={label} icon={icon} minHeight={'300'}>
                <ComponentStyled>
                    <Component
                        entity={entity}
                        updateEntity={updateEntity}
                        {...componentProps}
                    />
                </ComponentStyled>
            </Input>
        );
    }
}

FormComponent.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};

export default withTheme(FormComponent);