/*
 * Copyright (C) <2019>  <becon GmbH>
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

import {Row, Col} from "react-grid-system";
import Input from '../../../../../basic_components/inputs/Input';
import {cloneObject, isArray, isString} from "../../../../../../../utils/app";
import {
    FIELD_TYPE_OBJECT, FIELD_TYPE_STRING, checkIfParamIsArray, FIELD_TYPE_ARRAY,
} from "../utils";
import styles from '../../../../../../../themes/default/general/form_methods.scss';
import TooltipFontIcon from "../../../../../basic_components/tooltips/TooltipFontIcon";
import CConnection from "../../../../../../../classes/components/content/connection/CConnection";
import Dialog from "../../../../../basic_components/Dialog";


const PARAM_DELIMITER = '.';

/**
 * Component to create param for mapping
 */
class CreateParam extends Component{

    constructor(props){
        super(props);
        this.state = {
            isCreateParam: false,
            currentAddParam: this.setDefaultCurrentAddParam(),
        };
    }

    setDefaultCurrentAddParam(){
        return {
            index: '',
            field: '',
            type: ''
        };
    }

    /**
     * to set current create param
     */
    setCurrentCreateParam(value, param){
        const {connection} = this.props;
        currentItem = connection.fromConnector.getCurrentItem();
        let {currentAddParam} = this.state;
        currentAddParam[param] = value;
        currentAddParam.index = currentItem.index;
        this.setState({currentAddParam});
    }

    toggleCreateParam(){
        this.setState({
            isCreateParam: !this.state.isCreateParam,
            currentAddParam: this.setDefaultCurrentAddParam(),
        });
    }

    /**
     * to parse params before add
     */
    parseParams(){
        let {currentAddParam} = this.state;
        let {field} = currentAddParam;
        if(isString(field) && field !== '') {
            let fieldSplitted = field.split(PARAM_DELIMITER);
            currentAddParam = this.parseParam(fieldSplitted);
        }
        return currentAddParam;
    }

    /**
     * to parse param before add
     */
    parseParam(fieldSplitted){
        let param = this.setDefaultCurrentAddParam();
        if(fieldSplitted && fieldSplitted.length !== 0) {
            param.field = fieldSplitted[0];
            param.backendName = fieldSplitted[0];
            if (checkIfParamIsArray(param)) {
                param.type = FIELD_TYPE_ARRAY;
                param.field = fieldSplitted[0].slice(0, fieldSplitted[0].length - 2);
            } else {
                if (fieldSplitted.length > 1) {
                    param.type = FIELD_TYPE_OBJECT;
                } else {
                    param.type = FIELD_TYPE_STRING;
                }
            }
            if(fieldSplitted.length > 1){
                fieldSplitted.shift();
                param.subFieldList = [];
                param.subFieldList.push(this.parseParam(fieldSplitted));
            } else{
                const {connection} = this.props;
                let currentItem = connection.fromConnector.getCurrentItem();
                param.index = currentItem.index;
            }
        }
        return param;
    }

    /**
     * to add param for fromConnector
     */
    addFromParam(){
        let {currentMethod, updateMethods} = this.props;
        let method = cloneObject(currentMethod);
        if(method && isArray(method.fieldList)) {
            let param = this.parseParams();
            method.fieldList.push(param);
            if (!method.hasOwnProperty('hasParent')) {
                method.hasParent = false;
            }
            updateMethods('fromConnector', method);
            this.toggleCreateParam();
        }
    }

    /**
     * to get menu source for select
     */
    getMenuSource(){
        const {connection} = this.props;
        let menuSource = [];
        let currentItem = connection.fromConnector.getCurrentItem();
        if(currentItem) {
            if (currentItem.response) {
                menuSource = currentItem.response;
            }
        }
        return menuSource;
    }

    renderCreateParam(){
        const {readOnly} = this.props;
        let source = readOnly ? [] : this.getMenuSource();
        let noSelectedMethods = source.length < 1 && source.length === 1 && source[0].value === 0;
        if(!readOnly && !noSelectedMethods){
            return (
                <div className={styles.create_param}>
                    <div className={styles.or}>
                        or
                    </div>
                    <TooltipFontIcon
                        tooltip={'Add Param'}
                        className={styles.add_icon}
                        value={'add_circle_outline'}
                        onClick={::this.toggleCreateParam}/>
                </div>
            );
        }
        return null;
    }

    renderCreateParamDialog(){
        const {isCreateParam, currentAddParam} = this.state;
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.addFromParam}, {label: 'Cancel', onClick: ::this.toggleCreateParam}]}
                active={isCreateParam}
                onEscKeyDown={::this.toggleCreateParam}
                onOverlayClick={::this.toggleCreateParam}
                title={'Create Param'}
            >
                <Input
                    name={'fieldType'}
                    type={'text'}
                    onChange={e => ::this.setCurrentCreateParam(e, 'fieldType')}
                    value={currentAddParam.fieldType}
                    label={'Field Type'}
                    autoFocus
                />
                <Input
                    name={'name'}
                    type={'text'}
                    onChange={e => ::this.setCurrentCreateParam(e, 'name')}
                    value={currentAddParam.name}
                    label={'Name'}
                />
            </Dialog>
        );
    }

    render(){
        const {connection} = this.props;
        let currentItem = connection.fromConnector.getCurrentItem();
        if(!currentItem || currentItem.type){
            return null;
        }
        return (
            <Row>
                <Col md={5}>
                    {this.renderCreateParam()}
                    {this.renderCreateParamDialog()}
                </Col>
            </Row>
        );
    }
}

CreateParam.propTypes = {
    readOnly: PropTypes.bool,
    connection: PropTypes.instanceOf(CConnection).isRequired,
    updateEntity: PropTypes.func.isRequired,
};

CreateParam.defaultProps = {
    readOnly: false,
    currentMethod: null,
};

export default CreateParam;