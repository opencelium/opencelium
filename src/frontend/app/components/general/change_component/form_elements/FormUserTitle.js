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
import {withTranslation} from "react-i18next";
import { RadioGroup, RadioButton } from 'react-toolbox/lib/radio';
import FontIcon from "../../basic_components/FontIcon";

import styles from '../../../../themes/default/general/change_component.scss';
import {FormElement} from "../../../../decorators/FormElement";
import theme from "react-toolbox/lib/input/theme.css";

/**
 * Component for Form Input
 */
@FormElement()
@withTranslation('users')
class FormUserTitle extends Component{

    constructor(props){
        super(props);
    }

    componentDidUpdate(prevProps){
        const {focused, name} = prevProps.data;
        if(focused || this.props.data.focused){
            let elem = document.getElementById('radio_' + name);
            if(elem) {
                elem.focus();
            }
        }
    }

    handleChangeTitle(value){
        const {name, readonly} = this.props.data;
        const {entity, updateEntity} = this.props;
        entity[name] = value;
        updateEntity(entity);
    }

    render(){
        const {name, label, icon, required} = this.props.data;
        const {t, entity} = this.props;
        let {tourStep} = this.props.data;
        let value = entity[name];
        return (
            <div className={`${theme.withIcon} ${theme.input} ${styles.form_user_title} ${tourStep ? tourStep : ''}`}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.label}`}/>
                <RadioGroup name='theme' value={value} onChange={::this.handleChangeTitle} className={`${styles.radio_group}`}>
                    <RadioButton label={`${t('TITLE.MR')}`} value='mr' className={`${styles.radio_button} ${styles.first_radio_button}`}/>
                    <RadioButton label={`${t('TITLE.MRS')}`} value='mrs' className={`${styles.radio_button}`}/>
                </RadioGroup>
                <FontIcon value={icon} className={theme.icon}/>
                <span className={theme.bar}/>
                <label className={theme.label}>{label}</label>
            </div>
        );
    }
}

FormUserTitle.propTypes = {
    entity: PropTypes.object.isRequired,
    data: PropTypes.object.isRequired,
};


export default FormUserTitle;